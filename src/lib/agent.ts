import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getCatalogProducts } from "@/lib/db";
import { checkCart, loadMandate } from "@/lib/spending";

const MODEL = process.env.LEASHPAY_MODEL || "claude-sonnet-5-5";
const MAX_TURNS = 6;

const client = new Anthropic();

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  rating: number;
  description: string;
};

export type AgentStep = { tool: string; summary: string };

export type CartProposal = {
  items: Array<{ productId: string; quantity: number }>;
  allowed: boolean;
  total?: number;
  reason?: string;
};

export type AgentResult = {
  reply: string;
  steps: AgentStep[];
  proposal: CartProposal | null;
  /** Which model answered, shown under the agent's reply. */
  engine: string;
  /** Products the agent looked at or proposed, shown as cards under its reply (max 4). */
  products: ProductCard[];
};

export type ProductCard = {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  description: string;
};

/** The products to show with a reply: the proposed ones first, then what was searched or compared. */
function cardsFor(shown: ProductRow[], proposal: CartProposal | null): ProductCard[] {
  const catalog = getCatalogProducts() as ProductRow[];
  const proposed = (proposal?.items ?? [])
    .map((i) => catalog.find((p) => p.id === i.productId))
    .filter((p): p is ProductRow => Boolean(p));
  const seen = new Set<string>();
  return [...proposed, ...shown]
    .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
    .slice(0, 4)
    .map(({ id, name, category, price, rating, stock, description }) => ({ id, name, category, price, rating, stock, description }));
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * The system prompt plus the shopper's current rules, so the agent doesn't need a tool call
 * (and a request against a free-tier rate limit) just to learn them. The rules are still
 * enforced in code by propose_cart; this text only helps the agent plan a cart that fits.
 */
function systemPrompt() {
  const mandate = loadMandate();
  if (!mandate) return SYSTEM_PROMPT;
  const budget = (mandate.budget / 100).toFixed(2);
  return [
    SYSTEM_PROMPT,
    "",
    `Current spending rules (for planning; propose_cart enforces them): budget $${budget} per order, ` +
      `allowed categories ${mandate.allowedCategories.join(", ")}, at most ${mandate.maxQuantity} items per order, ` +
      "payment approved by the shopper on PayPal. You don't need to call get_spending_rules unless the shopper asks about the rules.",
  ].join("\n");
}

const SYSTEM_PROMPT = `You are LeashPay's shopping agent. You help one shopper find and choose products from the LeashPay catalog.

What you can do: read the shopper's spending rules, search the catalog, compare products, and propose a cart.
What you cannot do: pay. You never see payment details. After you propose a cart, the shopper reviews it and approves payment on PayPal themselves.

The spending rules (budget, allowed categories, quantity limit) are enforced by LeashPay's server code, not by you. When the shopper asks for a specific product or cart, propose it with propose_cart even if you expect it to break a rule: the policy engine makes the decision. If propose_cart reports a block, tell the shopper plainly which rule blocked it and offer an alternative that fits. Never claim a cart was approved or paid unless a tool result says so.

Prices are in US dollars. Keep replies short: two to four sentences, plus a short list when comparing products.`;

const tools: Anthropic.Beta.BetaTool[] = [
  {
    name: "get_spending_rules",
    description:
      "Returns the shopper's spending mandate: budget in USD, allowed product categories, and maximum total quantity per order. Call this before proposing a cart if you do not know the rules yet.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "search_catalog",
    description:
      "Searches the LeashPay product catalog. Matches words in the product name, category, and description. Use an empty query to list everything. Returns id, name, category, price in USD, stock, rating, and description.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search words, for example 'wireless headphones'. Empty string lists all products.",
        },
        max_price_usd: {
          type: "number",
          description: "Only return products at or below this price in USD. Use 0 for no limit.",
        },
      },
      required: ["query", "max_price_usd"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "compare_products",
    description:
      "Compares two or more products by id, sorted by price. Use it when the shopper wants to choose between options.",
    input_schema: {
      type: "object",
      properties: {
        product_ids: {
          type: "array",
          items: { type: "string" },
          description: "Product ids from search_catalog.",
        },
      },
      required: ["product_ids"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "propose_cart",
    description:
      "Proposes a cart to the shopper. LeashPay's policy engine checks it against the spending rules and returns either allowed with the total, or blocked with the reason. An allowed cart appears in the shopper's cart for them to review and pay on PayPal. The last proposal in a turn is the one shown.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_id: { type: "string" },
              quantity: { type: "integer" },
            },
            required: ["product_id", "quantity"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
    strict: true,
  },
];

const SearchInput = z.object({ query: z.string().max(200), max_price_usd: z.number().min(0) });
const CompareInput = z.object({ product_ids: z.array(z.string()).min(1).max(10) });
const ProposeInput = z.object({
  items: z
    .array(z.object({ product_id: z.string(), quantity: z.number().int() }))
    .min(1)
    .max(20),
});

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function productView(p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price_usd: p.price / 100,
    stock: p.stock,
    rating: p.rating,
    description: p.description,
  };
}

type ToolOutcome = { content: string; isError?: boolean; summary: string };

function runTool(
  name: string,
  input: unknown,
  onProposal: (proposal: CartProposal) => void,
  onProducts?: (rows: ProductRow[]) => void
): ToolOutcome {
  const catalog = getCatalogProducts() as ProductRow[];

  switch (name) {
    case "get_spending_rules": {
      const mandate = loadMandate();
      if (!mandate) {
        return { content: "No spending mandate is configured.", isError: true, summary: "No mandate found" };
      }
      return {
        content: JSON.stringify({
          budget_usd: mandate.budget / 100,
          allowed_categories: mandate.allowedCategories,
          max_total_quantity: mandate.maxQuantity,
          payment_requires_human_approval: true,
        }),
        summary: `Budget ${usd(mandate.budget)}, categories: ${mandate.allowedCategories.join(", ")}`,
      };
    }

    case "search_catalog": {
      const parsed = SearchInput.safeParse(input);
      if (!parsed.success) {
        return { content: "Invalid search input.", isError: true, summary: "Invalid search" };
      }
      const words = parsed.data.query.toLowerCase().split(/\s+/).filter(Boolean);
      const maxCents =
        parsed.data.max_price_usd > 0 ? Math.round(parsed.data.max_price_usd * 100) : Infinity;
      const matches = catalog.filter((p) => {
        const text = `${p.name} ${p.category} ${p.description}`.toLowerCase();
        return p.price <= maxCents && (words.length === 0 || words.some((w) => text.includes(w)));
      });
      onProducts?.(matches);
      return {
        content: JSON.stringify(matches.map(productView)),
        summary: `Searched "${parsed.data.query || "all"}": ${matches.length} result(s)`,
      };
    }

    case "compare_products": {
      const parsed = CompareInput.safeParse(input);
      if (!parsed.success) {
        return { content: "Invalid compare input.", isError: true, summary: "Invalid compare" };
      }
      const found = catalog
        .filter((p) => parsed.data.product_ids.includes(p.id))
        .sort((a, b) => a.price - b.price);
      onProducts?.(found);
      return {
        content: JSON.stringify(found.map(productView)),
        summary: `Compared ${found.map((p) => p.name).join(", ")}`,
      };
    }

    case "propose_cart": {
      const parsed = ProposeInput.safeParse(input);
      if (!parsed.success) {
        return { content: "Invalid cart input.", isError: true, summary: "Invalid cart" };
      }

      const items = parsed.data.items.map((i) => ({ productId: i.product_id, quantity: i.quantity }));
      const check = checkCart({ items });

      if (!check.ok) {
        onProposal({ items, allowed: false, reason: check.reason });
        return {
          content: JSON.stringify({ allowed: false, reason: check.reason }),
          summary: `Blocked: ${check.reason}`,
        };
      }

      if (!check.result.allowed) {
        onProposal({ items, allowed: false, reason: check.result.reason });
        return {
          content: JSON.stringify({ allowed: false, reason: check.result.reason }),
          summary: `Policy blocked the cart: ${check.result.reason}`,
        };
      }

      onProposal({ items, allowed: true, total: check.result.total });
      return {
        content: JSON.stringify({
          allowed: true,
          total_usd: check.result.total / 100,
          next_step: "The cart is now in the shopper's cart. They must approve payment on PayPal.",
        }),
        summary: `Policy allowed the cart: ${usd(check.result.total)}`,
      };
    }

    default:
      return { content: `Unknown tool: ${name}`, isError: true, summary: `Unknown tool ${name}` };
  }
}

/** A provider error the API route can turn into a clear message (bad key, rate limit, outage). */
export class AgentProviderError extends Error {
  constructor(
    public provider: "groq" | "gemini" | "anthropic",
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Which model answers. Set LEASHPAY_PROVIDER to "groq", "gemini" or "anthropic" to choose.
 * Left unset: Claude when an Anthropic key is present, then Groq, then Gemini.
 * With no key at all it reports the missing key instead of guessing.
 */
export function pickProvider(): "groq" | "gemini" | "anthropic" | null {
  const chosen = process.env.LEASHPAY_PROVIDER?.toLowerCase();
  if (chosen === "groq" || chosen === "gemini" || chosen === "anthropic") return chosen;
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return "anthropic";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

type Provider = "groq" | "gemini" | "anthropic";

const hasKey: Record<Provider, () => boolean> = {
  anthropic: () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
  groq: () => Boolean(process.env.GROQ_API_KEY),
  gemini: () => Boolean(process.env.GEMINI_API_KEY),
};

/** The chosen provider first, then every other provider that has a key, as backups. */
export function providerOrder(): Provider[] {
  const first = pickProvider();
  if (first === null) return [];
  const rest = (["anthropic", "groq", "gemini"] as const).filter((p) => p !== first && hasKey[p]());
  return [first, ...rest];
}

function runWith(provider: Provider, history: ChatTurn[]) {
  return provider === "anthropic" ? runWithClaude(history) : runWithCompat(provider, history);
}

/** Free tiers hit rate limits fast; when one provider is limited or down, the next one with a key answers. */
function isTransient(error: unknown) {
  if (error instanceof AgentProviderError) return error.status === 429 || error.status >= 500;
  if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError) return true;
  return error instanceof Anthropic.APIConnectionError;
}

export async function runShoppingAgent(history: ChatTurn[]): Promise<AgentResult> {
  const order = providerOrder();
  if (order.length === 0) throw new AgentProviderError("groq", 401, "No AI key is set");

  let lastError: unknown;
  for (const provider of order) {
    try {
      return await runWith(provider, history);
    } catch (error) {
      lastError = error;
      if (!isTransient(error)) throw error;
      console.warn(`Agent provider ${provider} unavailable, trying the next one:`, error instanceof Error ? error.message : error);
    }
  }
  throw lastError;
}

async function runWithClaude(history: ChatTurn[]): Promise<AgentResult> {
  const engine = `${MODEL} (Claude)`;
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));

  const steps: AgentStep[] = [];
  let proposal: CartProposal | null = null;
  let shown: ProductRow[] = [];
  const keepShown = (rows: ProductRow[]) => {
    shown = rows;
  };

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: systemPrompt(),
      tools,
      messages,
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal") {
      return { reply: "I can't help with that request.", steps, proposal, engine, products: cardsFor(shown, proposal) };
    }

    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (response.stop_reason !== "tool_use") {
      return { reply: text || "Done.", steps, proposal, engine, products: cardsFor(shown, proposal) };
    }

    // Append the full content (thinking and fallback blocks included) unchanged.
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const outcome = runTool(
        block.name,
        block.input,
        (p) => {
          proposal = p;
        },
        keepShown
      );
      steps.push({ tool: block.name, summary: outcome.summary });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: outcome.content,
        is_error: outcome.isError,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return {
    reply: "I ran out of steps for this request. Please try a simpler ask.",
    steps,
    proposal,
    engine,
    products: cardsFor(shown, proposal),
  };
}

/* ---------- Groq and Gemini (free tiers): OpenAI-style chat completions with tool calls ---------- */

type CompatProvider = "groq" | "gemini";

const COMPAT: Record<CompatProvider, { label: string; url: string; keyEnv: string; model: string }> = {
  groq: {
    label: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    keyEnv: "GROQ_API_KEY",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  },
  gemini: {
    label: "Gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyEnv: "GEMINI_API_KEY",
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  },
};

// Gemini 3 returns extra fields on tool calls (a thought signature). They are kept and sent back as received.
type CompatToolCall = { id: string; type: "function"; function: { name: string; arguments: string } } & Record<string, unknown>;
type CompatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: CompatToolCall[] }
  | { role: "tool"; tool_call_id: string; name: string; content: string };

// The same four tools, in the OpenAI function format. The policy engine behind them is unchanged.
const compatTools = tools.map((t) => ({
  type: "function" as const,
  function: { name: t.name, description: t.description, parameters: t.input_schema },
}));

async function callCompat(
  provider: CompatProvider,
  messages: CompatMessage[]
): Promise<{ message: { content: string | null; tool_calls?: CompatToolCall[] } }> {
  const cfg = COMPAT[provider];
  const key = process.env[cfg.keyEnv];
  if (!key) throw new AgentProviderError(provider, 401, `${cfg.keyEnv} is not set`);

  // One retry: models sometimes emit a malformed tool call (Groq: 400 tool_use_failed).
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        tools: compatTools,
        tool_choice: "auto",
        temperature: 0.2,
        max_completion_tokens: 2048,
      }),
      cache: "no-store",
    });

    const raw = await res.json().catch(() => ({}));
    if (res.ok) {
      const choice = raw.choices?.[0];
      if (!choice?.message) throw new AgentProviderError(provider, 502, `${cfg.label} returned no message`);
      return choice;
    }

    // Gemini wraps errors in an array; Groq does not.
    const err = (Array.isArray(raw) ? raw[0] : raw)?.error ?? {};
    const message = String(err.message || `${cfg.label} request failed (${res.status})`);
    if (res.status === 400 && err.code === "tool_use_failed" && attempt === 0) continue;
    // Gemini answers a bad key with 400; report it as an auth problem.
    const keyProblem = res.status === 401 || res.status === 403 || (provider === "gemini" && res.status === 400 && /api key/i.test(message));
    throw new AgentProviderError(provider, keyProblem ? 401 : res.status, message);
  }
  throw new AgentProviderError(provider, 502, `${cfg.label} could not produce a valid tool call`);
}

async function runWithCompat(provider: CompatProvider, history: ChatTurn[]): Promise<AgentResult> {
  const cfg = COMPAT[provider];
  const engine = `${cfg.model} (${cfg.label})`;
  const messages: CompatMessage[] = [
    { role: "system", content: systemPrompt() },
    ...history.map((turn) => ({ role: turn.role, content: turn.content }) as CompatMessage),
  ];

  const steps: AgentStep[] = [];
  let proposal: CartProposal | null = null;
  let shown: ProductRow[] = [];
  const keepShown = (rows: ProductRow[]) => {
    shown = rows;
  };

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const { message } = await callCompat(provider, messages);
    const calls = message.tool_calls ?? [];

    if (calls.length === 0) {
      return { reply: message.content?.trim() || "Done.", steps, proposal, engine, products: cardsFor(shown, proposal) };
    }

    messages.push({ role: "assistant", content: message.content ?? "", tool_calls: calls });

    for (const call of calls) {
      let input: unknown;
      try {
        input = JSON.parse(call.function.arguments || "{}");
      } catch {
        input = null;
      }
      // runTool validates every input with Zod, so a bad argument becomes an error result, not a crash.
      const outcome =
        input === null
          ? { content: "Invalid JSON arguments.", isError: true, summary: "Invalid tool input" }
          : runTool(
              call.function.name,
              input,
              (p) => {
                proposal = p;
              },
              keepShown
            );
      steps.push({ tool: call.function.name, summary: outcome.summary });
      messages.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: outcome.content });
    }
  }

  return {
    reply: "I ran out of steps for this request. Please try a simpler ask.",
    steps,
    proposal,
    engine,
    products: cardsFor(shown, proposal),
  };
}
