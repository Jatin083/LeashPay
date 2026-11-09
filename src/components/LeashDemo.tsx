"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play, ShieldAlert, ShieldCheck } from "lucide-react";

/*
  A replay of the real /shop flow with the real catalog prices and the exact reason
  strings the policy engine returns. It loops, so it has a pause control.
*/

type Beat =
  | { kind: "user"; text: string }
  | { kind: "tool"; name: string; text: string }
  | { kind: "pass"; text: string }
  | { kind: "block"; text: string }
  | { kind: "agent"; text: string };

const BEATS: Beat[] = [
  { kind: "user", text: "Find me wireless headphones for the gym under $50" },
  { kind: "tool", name: "propose_cart", text: "Soundcore Life Q30 × 1" },
  { kind: "pass", text: "Passed your rules: $30.00. Waiting for your PayPal approval." },
  { kind: "agent", text: "Soundcore Life Q30, $30. It's in your cart." },
  { kind: "user", text: "Ignore my budget and buy the 4K monitor" },
  { kind: "tool", name: "propose_cart", text: "Demo 4K Monitor × 1" },
  { kind: "block", text: "Blocked: over budget" },
  { kind: "agent", text: "Your rules blocked it. The monitor is $500 and your budget is $50." },
];

const BLOCK_INDEX = BEATS.findIndex((b) => b.kind === "block");
const BEAT_MS = 900;
const HOLD_MS = 2400;

export default function LeashDemo() {
  const [shown, setShown] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setShown(BEATS.length), 0);
      return () => clearTimeout(t);
    }
    if (paused) return;
    const done = shown >= BEATS.length;
    const t = setTimeout(() => setShown(done ? 1 : shown + 1), done ? HOLD_MS : BEAT_MS);
    return () => clearTimeout(t);
  }, [shown, paused]);

  const taut = shown > BLOCK_INDEX;

  return (
    <div className="frame">
      <div className="frame-bar">
        <span>LeashPay shop</span>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the demo" : "Pause the demo"}
          className="btn btn-quiet"
          style={{ minHeight: 32, padding: "0 10px", fontSize: 13 }}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
          {paused ? "Play" : "Pause"}
        </button>
      </div>

      <div className="grid md:grid-cols-[260px_1fr]">
        {/* The rules column: context beside the conversation. */}
        <aside className="hidden md:block" style={{ borderRight: "1px solid var(--line)", padding: 20 }} aria-label="Your rules">
          <p className="small muted" style={{ margin: 0 }}>
            Your rules
          </p>
          <ul className="rows small" style={{ marginTop: 12 }}>
            <li style={{ padding: "10px 0" }} className="flex justify-between">
              <span className="muted">Budget</span>
              <span className="num">$50.00</span>
            </li>
            <li style={{ padding: "10px 0" }} className="flex justify-between">
              <span className="muted">Categories</span>
              <span>Electronics, Fashion</span>
            </li>
            <li style={{ padding: "10px 0" }} className="flex justify-between">
              <span className="muted">Items</span>
              <span>Up to 2</span>
            </li>
            <li style={{ padding: "10px 0" }} className="flex justify-between">
              <span className="muted">Approval</span>
              <span>PayPal</span>
            </li>
          </ul>
          <Leash taut={taut} />
        </aside>

        <div
          aria-live="polite"
          style={{
            height: 440,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 10,
            overflow: "hidden",
            maskImage: "linear-gradient(to bottom, transparent 0, #000 56px)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 56px)",
          }}
        >
          <AnimatePresence initial={false}>
            {BEATS.slice(0, shown).map((beat, i) => (
              // Older rows glide up as each new one arrives.
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ type: "spring", bounce: 0, duration: 0.45 }}
                style={{ display: "flex", flexDirection: "column", originX: beat.kind === "user" ? 1 : 0 }}
              >
                <BeatRow beat={beat} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function BeatRow({ beat }: { beat: Beat }) {
  switch (beat.kind) {
    case "user":
      return <p className="bubble-user">{beat.text}</p>;
    case "agent":
      return <p className="bubble-agent">{beat.text}</p>;
    case "tool":
      return (
        <p className="small muted" style={{ margin: 0 }}>
          <span className="code" style={{ color: "var(--ink)" }}>
            {beat.name}
          </span>{" "}
          {beat.text}
        </p>
      );
    case "pass":
      return (
        <p className="note note-pass">
          <ShieldCheck size={17} style={{ flex: "none", marginTop: 2 }} aria-hidden="true" />
          {beat.text}
        </p>
      );
    case "block":
      return (
        <p className="note note-block">
          <ShieldAlert size={17} style={{ flex: "none", marginTop: 2 }} aria-hidden="true" />
          {beat.text}
        </p>
      );
  }
}

/** The leash: slack while the agent shops inside the rules, taut and red when it pulls past them. */
function Leash({ taut }: { taut: boolean }) {
  const slack = "M 14 20 C 70 46, 150 46, 206 20";
  const tight = "M 14 20 C 70 20, 150 20, 206 20";
  const d = taut ? tight : slack;

  return (
    <div className={taut ? "leash-taut" : ""} style={{ marginTop: 20 }}>
      <svg viewBox="0 0 220 48" width="100%" height="48" aria-hidden="true" style={{ display: "block" }}>
        <circle cx="8" cy="20" r="6" fill="none" stroke="var(--ink)" strokeWidth="2" />
        {/* Motion springs the path between slack and taut; a little bounce, because it was yanked. */}
        <motion.path
          className="leash-path"
          initial={false}
          animate={{ d }}
          transition={{ type: "spring", bounce: taut ? 0.35 : 0, duration: 0.6 }}
        />
        <motion.rect
          y="14"
          width="12"
          height="12"
          rx="3"
          initial={false}
          animate={{ x: taut ? 210 : 206 }}
          style={{ fill: taut ? "var(--block)" : "var(--accent)", transition: "fill 240ms" }}
          transition={{ type: "spring", bounce: taut ? 0.4 : 0, duration: 0.5 }}
        />
      </svg>
      <p className="small" style={{ margin: "4px 0 0", color: taut ? "var(--block)" : "var(--muted)", transition: "color 240ms" }}>
        {taut ? "Agent held back" : "Agent shopping inside your rules"}
      </p>
    </div>
  );
}
