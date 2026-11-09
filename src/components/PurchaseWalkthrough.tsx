"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CreditCard, Receipt, ShieldCheck, Wrench } from "lucide-react";
import { POLICY_RULES } from "@/lib/rules-copy";

/*
  One purchase, start to finish. The window on the left stays pinned (CSS sticky) while
  the five steps scroll past on the right; the step in the middle of the screen sets
  what the window shows. The values are the demo shop's real ones: $50 budget,
  Soundcore Life Q30 at $30.
*/

const STEPS = [
  {
    title: "You ask for something",
    text: "Plain words in the shop chat. The agent gets your message and your spending rules, nothing else.",
  },
  {
    title: "Claude searches and proposes",
    text: "It searches the catalog, compares what fits and proposes a cart with propose_cart. It can't add anything to your cart directly.",
  },
  {
    title: "Code checks every rule",
    text: "The policy engine prices the cart from the database and runs all eight rules. One failure blocks the cart and names the rule.",
  },
  {
    title: "You approve on PayPal",
    text: "The server checks the cart again, creates a PayPal Sandbox order for the checked total and sends you to approve it.",
  },
  {
    title: "The payment is verified",
    text: "On your way back, capture checks that PayPal took exactly the saved amount and currency before the order is marked paid.",
  },
];

const SWAP = { duration: 0.35, ease: [0.22, 1, 0.36, 1] } as const;

export default function PurchaseWalkthrough() {
  const [active, setActive] = useState(0);
  const steps = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      // A thin band across the middle of the screen decides the active step.
      { rootMargin: "-48% 0px -48% 0px" }
    );
    steps.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="walk grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="walk-visual lg:sticky lg:self-start" aria-hidden="true">
        <div className="frame">
          <div className="frame-bar">
            <span>LeashPay shop</span>
            <span className="chip">{`Step ${active + 1} of ${STEPS.length}`}</span>
          </div>
          <div className="walk-screen">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={SWAP}
                style={{ height: "100%" }}
              >
                <Screen step={active} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ol className="walk-steps">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            ref={(el) => {
              steps.current[i] = el;
            }}
            data-step={i}
            className={`walk-step${i === active ? " is-active" : ""}`}
          >
            <span className="walk-num num">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="h3" style={{ marginTop: 14 }}>
              {step.title}
            </h3>
            <p className="muted" style={{ margin: "10px 0 0", maxWidth: "32em" }}>
              {step.text}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Screen({ step }: { step: number }) {
  switch (step) {
    case 0:
      return (
        <div className="walk-pad walk-end">
          <p className="bubble-user" style={{ marginLeft: "auto" }}>
            Find me wireless headphones for the gym under $50
          </p>
        </div>
      );
    case 1:
      return (
        <div className="walk-pad walk-end" style={{ gap: 10 }}>
          <p className="bubble-user" style={{ marginLeft: "auto" }}>
            Find me wireless headphones for the gym under $50
          </p>
          {[
            ["search_catalog", "\"wireless headphones\": 3 results"],
            ["compare_products", "Soundcore Life Q30, Sony WH-CH520, JBL Tune 770NC"],
            ["propose_cart", "Soundcore Life Q30 × 1"],
          ].map(([tool, text], i) => (
            <motion.p
              key={tool}
              className="small muted"
              style={{ margin: 0, display: "flex", gap: 8, alignItems: "center" }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SWAP, delay: 0.15 + i * 0.18 }}
            >
              <Wrench size={12} />
              <span className="code" style={{ color: "var(--ink)" }}>
                {tool}
              </span>
              {text}
            </motion.p>
          ))}
        </div>
      );
    case 2:
      return (
        <div className="walk-pad">
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <span className="small muted">Policy engine</span>
            <span className="small num">$30.00 of $50.00</span>
          </div>
          <ul className="rows small" style={{ margin: 0 }}>
            {POLICY_RULES.map((rule, i) => (
              <motion.li
                key={rule.name}
                className="flex items-center justify-between"
                style={{ padding: "7px 0" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08 * i, duration: 0.2 }}
              >
                <span>{rule.name}</span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, duration: 0.4, delay: 0.08 * i + 0.1 }}
                  style={{ display: "inline-flex", color: "var(--accent)" }}
                >
                  <Check size={15} />
                </motion.span>
              </motion.li>
            ))}
          </ul>
          <p className="note note-pass" style={{ marginTop: 12 }}>
            <ShieldCheck size={16} style={{ flex: "none", marginTop: 2 }} />
            All eight rules passed. The cart is ready for your approval.
          </p>
        </div>
      );
    case 3:
      return (
        <div className="walk-pad walk-center">
          <div className="walk-pay">
            <CreditCard size={22} style={{ color: "var(--muted)" }} />
            <p className="small muted" style={{ margin: "10px 0 4px" }}>
              PayPal Sandbox approval
            </p>
            <p className="num" style={{ margin: 0, fontSize: 40, fontWeight: 500, letterSpacing: "-0.04em" }}>
              $30.00
            </p>
            <p className="small muted" style={{ margin: "4px 0 18px" }}>
              1 × Soundcore Life Q30
            </p>
            <motion.span
              className="btn"
              style={{ width: "100%", pointerEvents: "none" }}
              animate={{ scale: [1, 0.96, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.8 }}
            >
              Approve payment
            </motion.span>
          </div>
        </div>
      );
    default:
      return (
        <div className="walk-pad walk-center">
          <div className="walk-pay">
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
              style={{ display: "inline-flex", color: "var(--accent)" }}
            >
              <Receipt size={26} />
            </motion.span>
            <p className="h3" style={{ margin: "10px 0 14px" }}>
              Payment verified
            </p>
            <ul className="rows small" style={{ margin: 0, textAlign: "left" }}>
              <li className="flex justify-between" style={{ padding: "8px 0" }}>
                <span className="muted">Captured</span>
                <span className="num">$30.00 USD</span>
              </li>
              <li className="flex justify-between" style={{ padding: "8px 0" }}>
                <span className="muted">Saved total</span>
                <span className="num">$30.00 USD</span>
              </li>
              <li className="flex justify-between" style={{ padding: "8px 0" }}>
                <span className="muted">Order</span>
                <span className="chip chip-pass">Paid</span>
              </li>
            </ul>
          </div>
        </div>
      );
  }
}
