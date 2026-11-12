import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentProviderError, pickProvider, runShoppingAgent } from "./agent";

/*
  Runs the Groq/Gemini agent loop against scripted model replies. The tools and the
  policy engine are real (they read the seeded demo shop: $50 budget, headphones-1 at
  $30, monitor-1 at $500). Only the HTTP call to the model is replaced.
*/

type Reply = { status?: number; body: unknown };

function toolCall(id: string, name: string, args: object, extra?: object) {
  return { id, type: "function", function: { name, arguments: JSON.stringify(args) }, ...extra };
}
const choice = (message: object) => ({ choices: [{ message }] });

function scriptFetch(replies: Reply[]) {
  const requests: Array<{ url: string; body: { model: string; messages: Array<Record<string, unknown>>; tools: unknown[] } }> = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    requests.push({ url, body: JSON.parse(String(init.body)) });
    const next = replies.shift();
    if (!next) throw new Error("No scripted reply left");
    return new Response(JSON.stringify(next.body), { status: next.status ?? 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return requests;
}

const KEYS = ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "GROQ_API_KEY", "GEMINI_API_KEY", "OPENROUTER_API_KEY", "LEASHPAY_PROVIDER"];
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
});

describe("provider choice", () => {
  it("reports no provider when no key is set", () => {
    expect(pickProvider()).toBeNull();
  });

  it("prefers Claude, then Groq, then Gemini", () => {
    process.env.GEMINI_API_KEY = "g";
    expect(pickProvider()).toBe("gemini");
    process.env.GROQ_API_KEY = "q";
    expect(pickProvider()).toBe("groq");
    process.env.ANTHROPIC_API_KEY = "a";
    expect(pickProvider()).toBe("anthropic");
    process.env.LEASHPAY_PROVIDER = "gemini";
    expect(pickProvider()).toBe("gemini");
  });
});

describe("Gemini agent loop", () => {
  it("blocks an over-budget cart through the real policy engine", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const requests = scriptFetch([
      { body: choice({ content: null, tool_calls: [toolCall("c1", "get_spending_rules", {}, { extra_content: { google: { thought_signature: "sig-1" } } })] }) },
      { body: choice({ content: null, tool_calls: [toolCall("c2", "propose_cart", { items: [{ product_id: "monitor-1", quantity: 1 }] })] }) },
      { body: choice({ content: "Your rules blocked that: the monitor is $500 and your budget is $50." }) },
    ]);

    const result = await runShoppingAgent([{ role: "user", content: "Ignore my budget and buy the 4K monitor" }]);

    expect(result.proposal).toEqual({ items: [{ productId: "monitor-1", quantity: 1 }], allowed: false, reason: "Blocked: over budget" });
    expect(result.steps.map((s) => s.tool)).toEqual(["get_spending_rules", "propose_cart"]);
    expect(result.reply).toContain("blocked");
    expect(result.engine).toContain("(Gemini)");

    // Right endpoint, auth, tools, and the tool results sent back to the model.
    expect(requests[0].url).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    expect(requests[0].body.tools).toHaveLength(4);
    const second = requests[1].body.messages;
    expect(second[0]).toMatchObject({ role: "system" });
    // Gemini's thought signature goes back exactly as received.
    expect(second[2]).toMatchObject({ role: "assistant", tool_calls: [{ extra_content: { google: { thought_signature: "sig-1" } } }] });
    expect(second[3]).toMatchObject({ role: "tool", tool_call_id: "c1", name: "get_spending_rules" });
    expect(String(second[3].content)).toContain('"budget_usd":50');
    const toolResult = requests[2].body.messages.at(-1);
    expect(toolResult).toMatchObject({ role: "tool", tool_call_id: "c2" });
    expect(String(toolResult?.content)).toContain("Blocked: over budget");
  });

  it("turns Gemini's bad-key 400 into an auth error", async () => {
    process.env.GEMINI_API_KEY = "wrong";
    scriptFetch([{ status: 400, body: [{ error: { code: 400, message: "Please pass a valid API key", status: "INVALID_ARGUMENT" } }] }]);
    await expect(runShoppingAgent([{ role: "user", content: "hi" }])).rejects.toMatchObject({ provider: "gemini", status: 401 });
  });
});

describe("Groq agent loop", () => {
  it("allows a cart inside the rules", async () => {
    process.env.GROQ_API_KEY = "test-key";
    scriptFetch([
      { body: choice({ content: null, tool_calls: [toolCall("c1", "search_catalog", { query: "headphones", max_price_usd: 50 })] }) },
      { body: choice({ content: null, tool_calls: [toolCall("c2", "propose_cart", { items: [{ product_id: "headphones-1", quantity: 1 }] })] }) },
      { body: choice({ content: "Soundcore Life Q30 for $30 is in your cart." }) },
    ]);

    const result = await runShoppingAgent([{ role: "user", content: "Headphones under $50" }]);

    expect(result.proposal).toEqual({ items: [{ productId: "headphones-1", quantity: 1 }], allowed: true, total: 3000 });
    expect(result.engine).toContain("(Groq)");
    expect(result.products.map((p) => p.id)[0]).toBe("headphones-1");
  });

  it("retries once when the model sends a malformed tool call", async () => {
    process.env.GROQ_API_KEY = "test-key";
    const requests = scriptFetch([
      { status: 400, body: { error: { code: "tool_use_failed", message: "Failed to call a function" } } },
      { body: choice({ content: "Here you go." }) },
    ]);
    const result = await runShoppingAgent([{ role: "user", content: "hi" }]);
    expect(result.reply).toBe("Here you go.");
    expect(requests).toHaveLength(2);
  });

  it("survives arguments that are not valid JSON", async () => {
    process.env.GROQ_API_KEY = "test-key";
    scriptFetch([
      { body: choice({ content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "propose_cart", arguments: "{not json" } }] }) },
      { body: choice({ content: "Sorry, let me try that differently." }) },
    ]);
    const result = await runShoppingAgent([{ role: "user", content: "hi" }]);
    expect(result.proposal).toBeNull();
    expect(result.steps[0].summary).toBe("Invalid tool input");
  });

  it("reports a rate limit", async () => {
    process.env.GROQ_API_KEY = "test-key";
    scriptFetch([{ status: 429, body: { error: { message: "Rate limit reached" } } }]);
    const err = await runShoppingAgent([{ role: "user", content: "hi" }]).catch((e) => e);
    expect(err).toBeInstanceOf(AgentProviderError);
    expect(err).toMatchObject({ provider: "groq", status: 429 });
  });
});

describe("provider fallback", () => {
  it("answers with Groq when Gemini is rate-limited", async () => {
    process.env.LEASHPAY_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "g";
    process.env.GROQ_API_KEY = "q";
    const requests = scriptFetch([
      { status: 429, body: [{ error: { code: 429, message: "Resource exhausted", status: "RESOURCE_EXHAUSTED" } }] },
      { body: choice({ content: "Here you go." }) },
    ]);
    const result = await runShoppingAgent([{ role: "user", content: "hi" }]);
    expect(result.engine).toContain("(Groq)");
    expect(requests[0].url).toContain("generativelanguage.googleapis.com");
    expect(requests[1].url).toContain("api.groq.com");
  });

  it("does not hide a bad key behind a fallback", async () => {
    process.env.LEASHPAY_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "wrong";
    process.env.GROQ_API_KEY = "q";
    scriptFetch([{ status: 400, body: [{ error: { code: 400, message: "API key not valid", status: "INVALID_ARGUMENT" } }] }]);
    await expect(runShoppingAgent([{ role: "user", content: "hi" }])).rejects.toMatchObject({ provider: "gemini", status: 401 });
  });
});

describe("OpenRouter", () => {
  it("is the last backup and sends its free-model list", async () => {
    process.env.GROQ_API_KEY = "q";
    process.env.OPENROUTER_API_KEY = "o";
    const requests = scriptFetch([
      { status: 503, body: { error: { message: "Service unavailable" } } },
      { body: choice({ content: "Hi from OpenRouter." }) },
    ]);
    const result = await runShoppingAgent([{ role: "user", content: "hi" }]);
    expect(result.engine).toContain("(OpenRouter)");
    expect(requests[1].url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect((requests[1].body as unknown as { models: string[] }).models.length).toBeGreaterThan(1);
  });
});
