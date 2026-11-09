import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Scale, Search, ShoppingCart } from "lucide-react";
import FlowDiagram from "@/components/FlowDiagram";
import GlowCard from "@/components/GlowCard";
import PurchaseWalkthrough from "@/components/PurchaseWalkthrough";
import HeroIntro, { SplitWords } from "@/components/anim/HeroIntro";
import Reveal from "@/components/anim/Reveal";
import StarLink from "@/components/StarLink";
import { ThemedGradientText, ThemedShiny } from "@/components/Themed";

export const metadata: Metadata = {
  title: "How it works",
  description: "How LeashPay lets a Claude agent shop while code enforces your budget and PayPal takes your approval.",
};

const TOOLS = [
  {
    name: "get_spending_rules",
    icon: ListChecks,
    text: "Reads your budget, allowed categories and item limit, so the agent can plan a cart that fits.",
    returns: "Budget, categories, item limit",
  },
  {
    name: "search_catalog",
    icon: Search,
    text: "Finds products by name, category or description, with an optional price ceiling.",
    returns: "Matching products with prices",
  },
  {
    name: "compare_products",
    icon: Scale,
    text: "Lines up two or more products by price, rating and stock when you want to choose.",
    returns: "Products sorted by price",
  },
  {
    name: "propose_cart",
    icon: ShoppingCart,
    text: "Sends a cart to the policy engine. An allowed cart lands in your cart; a blocked one comes back with the rule it broke.",
    returns: "Allowed with total, or the block reason",
  },
];

const CHECKS = [
  {
    when: "When the agent proposes",
    text: "propose_cart runs the policy engine before anything reaches your cart. The agent hears the exact reason when it is blocked.",
  },
  {
    when: "When you press Pay with PayPal",
    text: "The server checks the cart again and prices it from the database. Amounts sent by the browser are ignored.",
  },
  {
    when: "When PayPal sends you back",
    text: "Capture checks PayPal took exactly the saved total and currency. A mismatch marks the order for review.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="center dark hero-mesh" aria-labelledby="how-h" style={{ paddingBlock: "clamp(72px, 12vh, 128px) clamp(160px, 24vh, 240px)" }}>
        <HeroIntro className="wrap">
          <span className="chip" data-hero="pill" style={{ background: "color-mix(in srgb, var(--ink) 9%, transparent)", border: "1px solid var(--line)" }}>
            <ThemedShiny text="Five steps, two places that can say yes to money" />
          </span>
          <h1 id="how-h" className="h1" style={{ marginTop: 16, maxWidth: "12em", marginInline: "auto" }}>
            <SplitWords text="How LeashPay checks every purchase" accentFrom={2} />
          </h1>
          <p className="lede" data-hero="lede" style={{ marginTop: 16 }}>
            Claude does the shopping. Code holds the rules. You hold the approval. Here is the path a single
            purchase takes.
          </p>
          <div data-hero="window" style={{ marginTop: 64 }}>
            <FlowDiagram />
          </div>
        </HeroIntro>
      </section>

      {/* One purchase, step by step, with a pinned window that follows along. */}
      <section aria-labelledby="walk-h" style={{ paddingBlock: "clamp(72px, 12vh, 128px)" }}>
        <div className="wrap">
          <Reveal>
            <h2 id="walk-h" className="h2" data-reveal style={{ maxWidth: "14em" }}>
              Follow one purchase from chat to receipt
            </h2>
            <p className="lede" data-reveal style={{ marginTop: 16 }}>
              The $30 headphones in the demo shop, with a $50 budget. Scroll, and the window follows along.
            </p>
          </Reveal>
          <div style={{ marginTop: 56 }}>
            <PurchaseWalkthrough />
          </div>
        </div>
      </section>

      <section className="screen" aria-labelledby="tools-h">
        <Reveal className="wrap">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <h2 id="tools-h" className="h2" data-reveal>
              The agent&apos;s four tools
            </h2>
            <p className="lede" data-reveal>
              Claude works only through these. None of them can pay, change your rules or see payment details.
            </p>
          </div>
          <ul className="grid gap-4 md:grid-cols-2" style={{ listStyle: "none", margin: "48px 0 0", padding: 0 }}>
            {TOOLS.map((tool) => (
              <li key={tool.name} data-reveal>
                <GlowCard className="h-full">
                  <div className="flex items-center gap-3">
                    <span className="tool-icon">
                      <tool.icon size={18} aria-hidden="true" />
                    </span>
                    <span className="code" style={{ fontSize: "1rem", fontWeight: 500 }}>
                      {tool.name}
                    </span>
                  </div>
                  <p style={{ margin: "16px 0 0" }}>{tool.text}</p>
                  <p className="small muted" style={{ margin: "16px 0 0", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                    Returns: {tool.returns}
                  </p>
                </GlowCard>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* The three checks: a deep panel, numbered because they happen in order. */}
      <section aria-labelledby="checks-h" style={{ paddingBlock: "clamp(24px, 4vh, 48px)" }}>
        <Reveal className="wrap">
          <div className="panel dark" style={{ padding: "clamp(40px, 6vw, 80px)" }}>
            <h2 id="checks-h" className="h2" data-reveal style={{ maxWidth: "14em" }}>
              Three checks between the agent and your money
            </h2>
            <p className="lede" data-reveal style={{ marginTop: 16 }}>
              Totals always come from the shop&apos;s database. The agent, the browser and the chat never set a price.
            </p>
            <ol className="checks" style={{ listStyle: "none", padding: 0, margin: "56px 0 0" }}>
              {CHECKS.map((check, i) => (
                <li key={check.when} className="check" data-reveal>
                  <span className="check-num num">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="h3" style={{ marginTop: 18 }}>
                    {check.when}
                  </h3>
                  <p className="muted" style={{ margin: "10px 0 0" }}>
                    {check.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      <section aria-labelledby="try-h" style={{ paddingBlock: "clamp(24px, 4vh, 48px) clamp(48px, 8vh, 96px)" }}>
        <Reveal className="wrap">
          <div className="panel dark center" style={{ paddingBlock: "clamp(72px, 12vh, 136px)", paddingInline: "var(--gutter)" }}>
            <h2 id="try-h" className="h2" data-reveal style={{ fontSize: "clamp(36px, 5vw, 72px)", letterSpacing: "-0.05em" }}>
              <ThemedGradientText>Try to break the budget</ThemedGradientText>
            </h2>
            <p className="lede" data-reveal style={{ marginTop: 20 }}>
              Ask the agent to ignore your $50 limit and buy the $500 monitor. Watch the rule it hits.
            </p>
            <div data-reveal className="flex flex-wrap justify-center gap-3" style={{ marginTop: 32 }}>
              <StarLink href="/shop">Open the shop</StarLink>
              <Link href="/rules" className="btn btn-quiet" style={{ minHeight: 48 }}>
                See your rules
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
