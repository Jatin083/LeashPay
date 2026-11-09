import Link from "next/link";
import { Check, X } from "lucide-react";
import LeashDemo from "@/components/LeashDemo";
import DrawLeash from "@/components/DrawLeash";
import HeroIntro, { SplitWords } from "@/components/anim/HeroIntro";
import Reveal from "@/components/anim/Reveal";
import RulesStage from "@/components/RulesStage";
import BlurText from "@/components/reactbits/BlurText";
import { ThemedGradientText, ThemedShiny } from "@/components/Themed";
import GlowCard from "@/components/GlowCard";
import StarLink from "@/components/StarLink";

const STEPS = [
  { title: "You set the rules", text: "Budget, categories and an item limit, stored on the server where no prompt can reach them." },
  { title: "Claude builds the cart", text: "The agent searches the catalog, compares options and proposes a cart." },
  { title: "Code checks the cart", text: "The policy engine prices it from the database and runs every rule." },
  { title: "You approve on PayPal", text: "Nothing is paid until you approve it yourself on PayPal." },
];

const CAN = ["Search the catalog", "Compare products", "Read your spending rules", "Propose a cart for review"];
const CANNOT = ["See your payment details", "Change your budget", "Create or capture a payment", "Skip your PayPal approval"];


export default function Home() {
  return (
    <>
      {/* Hero, dealt "centred". A CSS gradient mesh in cobalt that fades into the page below. */}
      <section className="center dark hero-mesh" style={{ minHeight: "calc(100svh - var(--nav-h))", paddingTop: "clamp(56px, 9vh, 104px)", paddingBottom: 72 }}>

        <HeroIntro className="wrap">
          <span className="chip" data-hero="pill" style={{ background: "color-mix(in srgb, var(--ink) 9%, transparent)", border: "1px solid var(--line)" }}>
            <ThemedShiny text="$50 demo budget, PayPal Sandbox" />
          </span>
          <h1 className="h1" style={{ marginTop: 16, maxWidth: "13em", marginInline: "auto" }}>
            <SplitWords text="An AI shopping agent that can't overspend" accentFrom={5} />
          </h1>
          <p className="lede" data-hero="lede" style={{ marginTop: 16 }}>
            Claude finds what you ask for and builds the cart. Your budget is checked in code, and every
            payment waits for your approval on PayPal.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3" data-hero="actions" style={{ marginTop: 28 }}>
            <Link href="/shop" className="btn">
              Open the shop
            </Link>
            <Link href="/how-it-works" className="btn btn-quiet">
              See how it works
            </Link>
          </div>
          <div data-hero="window" className="window-glow" style={{ marginTop: 48, maxWidth: 1000, marginInline: "auto" }}>
            <LeashDemo />
          </div>
        </HeroIntro>
      </section>

      {/* A real sequence, so the steps are numbered. Spotlight cards follow the pointer. */}
      <section className="screen" aria-labelledby="steps-h">
        <Reveal className="wrap">
          <BlurText as="h2" id="steps-h" className="h2" text="Four steps from request to receipt" delay={60} animateBy="words" direction="bottom" />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ listStyle: "none", margin: "56px 0 0", padding: 0 }}>
            {STEPS.map((step, i) => (
              <li key={step.title} data-reveal>
                <GlowCard className="h-full">
                  <span className="num" style={{ color: "var(--cobalt)", fontSize: 40, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="h3" style={{ marginTop: 28 }}>
                    {step.title}
                  </h3>
                  <p className="muted" style={{ margin: "10px 0 0" }}>
                    {step.text}
                  </p>
                </GlowCard>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* The eight rules: one card, pinned while each rule takes its turn. */}
      <section aria-label="Eight rules checked in code" style={{ paddingBlock: "clamp(24px, 4vh, 48px)" }}>
        <RulesStage />
      </section>

      <section className="screen" aria-labelledby="scope-h">
        <Reveal className="wrap">
          <BlurText as="h2" id="scope-h" className="h2" text="What the agent can touch, and what it can't" delay={50} animateBy="words" direction="bottom" />
          <div className="grid gap-4 md:grid-cols-2" style={{ marginTop: 56 }}>
            <GlowCard>
              <span className="chip chip-pass">The agent can</span>
              <ul className="rows" style={{ marginTop: 20 }}>
                {CAN.map((item) => (
                  <li key={item} className="h3" style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span data-pop style={{ display: "inline-flex" }}>
                      <Check size={20} color="var(--pass)" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
            <GlowCard tone="red">
              <span className="chip chip-block">The agent can never</span>
              <ul className="rows" style={{ marginTop: 20 }}>
                {CANNOT.map((item) => (
                  <li key={item} className="h3" style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span data-pop style={{ display: "inline-flex" }}>
                      <X size={20} color="var(--block)" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
          </div>
        </Reveal>
      </section>

      {/* Close: the page's one brand line, with a fact under it. The leash draws with the scroll here. */}
      <section aria-labelledby="close-h" style={{ paddingBlock: "clamp(24px, 4vh, 48px) clamp(48px, 8vh, 96px)" }}>
        <Reveal className="wrap">
          <div className="panel dark center" style={{ paddingBlock: "clamp(80px, 14vh, 160px)", paddingInline: "var(--gutter)", overflow: "hidden" }}>
          <h2 id="close-h" className="h2" data-reveal style={{ fontSize: "clamp(44px, 6vw, 88px)", letterSpacing: "-0.05em" }}>
            <ThemedGradientText>Shop on a leash</ThemedGradientText>
          </h2>
          <div style={{ marginTop: 40 }}>
            <DrawLeash />
          </div>
          <p className="lede" data-reveal style={{ marginTop: 40 }}>
            Try it with the $50 demo budget. Payments run in PayPal Sandbox.
          </p>
          <div data-reveal style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
            <StarLink href="/shop">Open the shop</StarLink>
          </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
