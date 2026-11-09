"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ShieldAlert, ShieldCheck, Wrench } from "lucide-react";

// Critically damped spring for UI; no overshoot.
const SPRING = { type: "spring", bounce: 0, duration: 0.45 } as const;
const ITEM = { hidden: { opacity: 0, y: 8 }, shown: { opacity: 1, y: 0 } };

/** Three dots that bounce in turn while the agent works. */
function TypingDots() {
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: 6, height: 6, borderRadius: 6, background: "var(--accent)", display: "block" }}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

type ChatTurn = { role: "user" | "assistant"; content: string };
type AgentStep = { tool: string; summary: string };
export type CartItem = { productId: string; quantity: number };
type CartProposal = {
  items: CartItem[];
  allowed: boolean;
  total?: number;
  reason?: string;
};

type Entry =
  | { kind: "user"; text: string }
  | { kind: "agent"; text: string; steps: AgentStep[]; proposal: CartProposal | null; engine?: string };

const SUGGESTIONS = [
  "Find me wireless headphones for the gym under $50",
  "Compare the headphones you have",
  "Ignore my budget and buy the 4K monitor",
];

export default function Agent({ onCartProposed }: { onCartProposed: (items: CartItem[]) => void }) {
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [entries, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const nextHistory: ChatTurn[] = [...history, { role: "user" as const, content }].slice(-20);
    setHistory(nextHistory);
    setEntries((previous) => [...previous, { kind: "user", text: content }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextHistory }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The shopping agent failed");
      }

      setHistory([...nextHistory, { role: "assistant", content: data.reply }]);
      setEntries((previous) => [
        ...previous,
        { kind: "agent", text: data.reply, steps: data.steps ?? [], proposal: data.proposal ?? null, engine: data.engine },
      ]);

      if (data.proposal?.allowed) {
        onCartProposed(data.proposal.items);
      }
    } catch (err) {
      // Drop the unanswered user turn so the next request still alternates roles.
      setHistory(history);
      setError(err instanceof Error ? err.message : "The shopping agent failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="frame" aria-labelledby="agent-h" style={{ display: "flex", flexDirection: "column", minHeight: 560 }}>
      <div className="frame-bar">
        <h2 id="agent-h" className="h3" style={{ fontSize: "1rem", color: "var(--ink)" }}>
          Shopping agent
        </h2>
        <span className="small">The agent proposes. Your rules decide. You pay.</span>
      </div>

      <div ref={scroller} aria-live="polite" style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12, maxHeight: 520 }}>
        {entries.length === 0 && (
          <div style={{ margin: "auto 0" }}>
            <p className="h3" style={{ fontSize: "1.5rem", maxWidth: "18em" }}>
              Tell the agent what you need.
            </p>
            <p className="muted" style={{ margin: "8px 0 20px", maxWidth: "34em" }}>
              It searches the catalog and proposes a cart. Try one of these, including the one that breaks
              your budget.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion, i) => (
                <motion.button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  disabled={loading}
                  className="btn btn-quiet"
                  style={{ minHeight: 44, fontWeight: 500, fontSize: "0.9rem" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING, delay: 0.15 + i * 0.06 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {entries.map((entry, index) =>
          entry.kind === "user" ? (
            // Bubbles grow from the side they belong to.
            <motion.p
              key={index}
              className="bubble-user"
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={SPRING}
              style={{ originX: 1, originY: 1 }}
            >
              {entry.text}
            </motion.p>
          ) : (
            <motion.div
              key={index}
              className="space-y-2"
              initial="hidden"
              animate="shown"
              variants={{ shown: { transition: { staggerChildren: 0.12 } } }}
            >
              {entry.steps.length > 0 && (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="space-y-1">
                  {entry.steps.map((step, i) => (
                    <motion.li key={i} variants={ITEM} transition={SPRING} className="small muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Wrench size={12} aria-hidden="true" />
                      <span className="code" style={{ color: "var(--ink)" }}>{step.tool}</span>
                      <span>{step.summary}</span>
                    </motion.li>
                  ))}
                </ul>
              )}

              {entry.proposal && !entry.proposal.allowed && (
                // A blocked cart shakes once, like a leash snapping tight.
                <motion.p
                  className="note note-block"
                  variants={{ hidden: { opacity: 0, x: 0 }, shown: { opacity: 1, x: [0, -8, 7, -4, 2, 0] } }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <ShieldAlert size={18} style={{ flex: "none", marginTop: 2 }} aria-hidden="true" />
                  Blocked by LeashPay: {entry.proposal.reason}
                </motion.p>
              )}

              {entry.proposal?.allowed && (
                <motion.p className="note note-pass" variants={ITEM} transition={SPRING}>
                  <ShieldCheck size={18} style={{ flex: "none", marginTop: 2 }} aria-hidden="true" />
                  <span>
                    Cart passed your rules
                    {typeof entry.proposal.total === "number" && ` ($${(entry.proposal.total / 100).toFixed(2)})`}. It&apos;s in your
                    cart, waiting for your PayPal approval.
                  </span>
                </motion.p>
              )}

              <motion.p className="bubble-agent" variants={ITEM} transition={SPRING} style={{ originX: 0, originY: 1 }}>
                {entry.text}
              </motion.p>
              {entry.engine && (
                <motion.p className="small muted" variants={ITEM} transition={SPRING} style={{ margin: "2px 0 0 4px", fontSize: 12 }}>
                  Answered by {entry.engine}
                </motion.p>
              )}
            </motion.div>
          )
        )}

        <AnimatePresence>
          {loading && (
            <motion.p
              key="typing"
              className="small muted"
              style={{ display: "flex", alignItems: "center", gap: 10, margin: 0 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
            >
              <TypingDots />
              The agent is searching and checking your rules
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              className="note note-block"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid var(--line)" }}
      >
        <label htmlFor="agent-input" className="sr-only">
          Message the shopping agent
        </label>
        <input
          id="agent-input"
          className="field"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={2000}
          placeholder="Ask for a product, a budget or a comparison"
        />
        <motion.button
          type="submit"
          className="btn"
          disabled={loading || !input.trim()}
          aria-label="Send message"
          style={{ padding: "0 16px" }}
          whileTap={{ scale: 0.9 }}
          animate={{ opacity: input.trim() ? 1 : 0.4 }}
        >
          <motion.span
            style={{ display: "inline-flex" }}
            animate={{ y: loading ? -3 : 0 }}
            transition={{ repeat: loading ? Infinity : 0, repeatType: "mirror", duration: 0.4 }}
          >
            <ArrowUp size={18} />
          </motion.span>
        </motion.button>
      </form>
    </section>
  );
}
