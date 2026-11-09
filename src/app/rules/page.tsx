import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Database, Lock, Bot } from "lucide-react";
import { getCatalogProducts } from "@/lib/db";
import { loadMandate } from "@/lib/spending";
import { POLICY_RULES } from "@/lib/rules-copy";
import type { CatalogProduct } from "@/lib/policy";
import GlowCard from "@/components/GlowCard";
import RulesSimulator from "@/components/RulesSimulator";
import HeroIntro, { SplitWords } from "@/components/anim/HeroIntro";
import Reveal from "@/components/anim/Reveal";
import CountUp from "@/components/reactbits/CountUp";
import StarLink from "@/components/StarLink";
import { ThemedGradientText, ThemedShiny } from "@/components/Themed";

export const metadata: Metadata = {
  title: "Spending rules",
  description: "The budget, categories and limits the LeashPay agent must shop inside, a live cart tester, and every reason a cart gets blocked.",
};

type Product = CatalogProduct & { rating: number; description: string };

/** The live mandate, as glass cards in the hero. */
async function MandateCards() {
  await connection();
  const mandate = loadMandate();

  if (!mandate) {
    return (
      <p role="alert" className="glass-card" style={{ marginTop: 48, color: "var(--block)" }}>
        No valid spending mandate is stored. Checkout stays blocked until one is set.
      </p>
    );
  }

  const cards = [
    { label: "Budget per order", value: <CountUp to={mandate.budget / 100} prefix="$" decimals={2} duration={1.4} /> },
    { label: "Allowed categories", value: mandate.allowedCategories.join(", ") },
    { label: "Items per order", value: `Up to ${mandate.maxQuantity}` },
    { label: "Payment approval", value: "On PayPal, by you" },
  ];

  return (
    <ul data-enter className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" style={{ listStyle: "none", margin: "56px 0 0", padding: 0, textAlign: "left" }}>
      {cards.map((card, i) => (
        <li key={card.label} className="glass-card">
          <p className="small muted" style={{ margin: 0 }}>
            {card.label}
          </p>
          <p style={{ margin: "12px 0 0", fontSize: "clamp(22px, 2.2vw, 30px)", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.03em", color: i === 0 ? "var(--t-hot)" : undefined }}>
            {card.value}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** The cart tester needs the live mandate and catalog. */
async function Simulator() {
  await connection();
  const mandate = loadMandate();
  const products = getCatalogProducts() as Product[];
  if (!mandate) return null;
  return <RulesSimulator mandate={mandate} products={products} />;
}

const WHERE = [
  { icon: Database, title: "Stored on the server", text: "The rules sit in the mandates table of the shop's database, not in the chat or the prompt." },
  { icon: Bot, title: "Read-only for the agent", text: "Claude can read them with get_spending_rules. No tool lets it change them." },
  { icon: Lock, title: "Checked twice", text: "Once when the agent proposes a cart, and again before the PayPal order is created." },
];

export default function RulesPage() {
  return (
    <>
      <section className="center dark hero-mesh" aria-labelledby="rules-h" style={{ paddingBlock: "clamp(72px, 12vh, 128px) clamp(160px, 24vh, 240px)" }}>
        <HeroIntro className="wrap">
          <span className="chip" data-hero="pill" style={{ background: "color-mix(in srgb, var(--ink) 9%, transparent)", border: "1px solid var(--line)" }}>
            <ThemedShiny text="Read live from the shop's database" />
          </span>
          <h1 id="rules-h" className="h1" style={{ marginTop: 16 }}>
            <SplitWords text="Your spending rules" accentFrom={1} />
          </h1>
          <p className="lede" data-hero="lede" style={{ marginTop: 16 }}>
            The agent shops inside these. It can read them, but nothing it says or does can change them.
          </p>
          <Suspense fallback={<div style={{ height: 120, marginTop: 56 }} />}>
            <MandateCards />
          </Suspense>
        </HeroIntro>
      </section>

      <section aria-labelledby="sim-h" style={{ paddingBlock: "clamp(72px, 12vh, 128px)" }}>
        <div className="wrap">
          <Reveal>
            <h2 id="sim-h" className="h2" data-reveal style={{ maxWidth: "14em" }}>
              Test a cart against your rules
            </h2>
            <p className="lede" data-reveal style={{ marginTop: 16 }}>
              Add products and watch each rule. This runs the same policy engine the server runs before any PayPal
              order exists. Nothing here is saved or paid.
            </p>
          </Reveal>
          <div style={{ marginTop: 48 }}>
            <Suspense fallback={<div style={{ height: 480 }} />}>
              <Simulator />
            </Suspense>
          </div>
        </div>
      </section>

      <section aria-labelledby="reasons-h" style={{ paddingBottom: "clamp(72px, 12vh, 128px)" }}>
        <Reveal className="wrap">
          <h2 id="reasons-h" className="h2" data-reveal>
            Every reason a cart gets blocked
          </h2>
          <p className="lede" data-reveal style={{ marginTop: 16 }}>
            The red text is exactly what the policy engine returns, and exactly what you see in the shop.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ listStyle: "none", margin: "48px 0 0", padding: 0 }}>
            {POLICY_RULES.map((rule, i) => (
              <li key={rule.name} data-reveal>
                <GlowCard tone="red" className="h-full">
                  <span className="small muted num">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="h3" style={{ marginTop: 14, fontSize: 20 }}>
                    {rule.name}
                  </h3>
                  <p className="small muted" style={{ margin: "8px 0 18px" }}>
                    {rule.text}
                  </p>
                  <span className="chip chip-block" data-pop>
                    {rule.reason}
                  </span>
                </GlowCard>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section aria-labelledby="where-h" style={{ paddingBottom: "clamp(48px, 8vh, 96px)" }}>
        <Reveal className="wrap">
          <div className="panel dark" style={{ padding: "clamp(40px, 6vw, 80px)" }}>
            <h2 id="where-h" className="h2" data-reveal style={{ fontSize: "clamp(34px, 4.6vw, 64px)", letterSpacing: "-0.05em" }}>
              <ThemedGradientText>Where the rules live</ThemedGradientText>
            </h2>
            <ul className="checks" style={{ listStyle: "none", padding: 0, margin: "48px 0 0" }}>
              {WHERE.map((w) => (
                <li key={w.title} className="check" data-reveal>
                  <span className="tool-icon" style={{ background: "color-mix(in srgb, var(--t-hot) 18%, transparent)", color: "var(--t-hot)" }}>
                    <w.icon size={18} aria-hidden="true" />
                  </span>
                  <h3 className="h3" style={{ marginTop: 18 }}>
                    {w.title}
                  </h3>
                  <p className="muted" style={{ margin: "10px 0 0" }}>
                    {w.text}
                  </p>
                </li>
              ))}
            </ul>
            <div data-reveal className="flex flex-wrap gap-3" style={{ marginTop: 40 }}>
              <StarLink href="/shop">Open the shop</StarLink>
              <Link href="/how-it-works" className="btn btn-quiet" style={{ minHeight: 48 }}>
                See how it works
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
