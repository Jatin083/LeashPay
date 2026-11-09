"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Minus, Plus, RotateCcw, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { evaluatePolicy, type CatalogProduct, type Mandate } from "@/lib/policy";
import { POLICY_RULES } from "@/lib/rules-copy";

/*
  A cart tester. It runs evaluatePolicy, the same function the server runs before any
  PayPal order exists, on the cart you build here. The per-rule ticks show each check on
  its own; the verdict at the bottom is the engine's real answer (it stops at the first failure).
  Nothing here is saved or paid; the shop and the server still check everything again.
*/

type Product = CatalogProduct & { rating: number; description: string };
type Line = { productId: string; quantity: number };

const usd = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

export default function RulesSimulator({ mandate, products }: { mandate: Mandate; products: Product[] }) {
  const [cart, setCart] = useState<Line[]>([]);

  const total = cart.reduce((sum, line) => sum + (products.find((p) => p.id === line.productId)?.price ?? 0) * line.quantity, 0);
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);

  const checks = useMemo(() => {
    const items = cart.map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) }));
    const known = items.every((i) => i.product);
    const byRule: Record<string, boolean> = {
      Budget: total <= mandate.budget,
      Categories: items.every((i) => i.product && mandate.allowedCategories.includes(i.product.category)),
      Quantity: count <= mandate.maxQuantity,
      Stock: items.every((i) => i.product && i.line.quantity <= i.product.stock),
      "Real products only": known,
      "No duplicate lines": new Set(cart.map((l) => l.productId)).size === cart.length,
      "One currency": items.every((i) => i.product?.currency === mandate.currency),
      "Human approval": mandate.requireApproval === true,
    };
    return byRule;
  }, [cart, products, mandate, total, count]);

  const verdict = cart.length ? evaluatePolicy(mandate, { items: cart }, products) : null;

  function change(productId: string, delta: number) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (!existing) return delta > 0 ? [...prev, { productId, quantity: 1 }] : prev;
      return prev
        .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0);
    });
  }

  const over = total > mandate.budget;
  const fill = Math.min(total / mandate.budget, 1.2) / 1.2;

  return (
    <div className="sim grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Products */}
      <div className="sim-panel">
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <p className="h3" style={{ margin: 0, fontSize: 18 }}>
            Build a cart
          </p>
          <button type="button" className="btn btn-quiet" style={{ minHeight: 36, padding: "0 12px", fontSize: 13 }} onClick={() => setCart([])} disabled={!cart.length}>
            <RotateCcw size={14} /> Clear
          </button>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="space-y-2">
          {products.map((p) => {
            const qty = cart.find((l) => l.productId === p.id)?.quantity ?? 0;
            const allowed = mandate.allowedCategories.includes(p.category);
            return (
              <li key={p.id} className={`sim-row${qty ? " is-in" : ""}`}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>{p.name}</p>
                  <p className="small muted" style={{ margin: 0 }}>
                    {p.category}
                    {!allowed && " (not allowed)"} · {p.stock} in stock
                  </p>
                </div>
                <span className="num" style={{ fontWeight: 500 }}>
                  {usd(p.price)}
                </span>
                <div className="sim-qty">
                  <button type="button" onClick={() => change(p.id, -1)} disabled={!qty} aria-label={`One less ${p.name}`}>
                    <Minus size={14} />
                  </button>
                  <span className="num" aria-live="polite">
                    {qty}
                  </span>
                  <button type="button" onClick={() => change(p.id, 1)} aria-label={`One more ${p.name}`}>
                    <Plus size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Live check */}
      <div className="sim-panel">
        <div className="flex items-baseline justify-between">
          <p className="h3" style={{ margin: 0, fontSize: 18 }}>
            Rule check
          </p>
          <p className="num" style={{ margin: 0 }}>
            <span style={{ color: over ? "var(--block)" : "var(--ink)", fontWeight: 600 }}>{usd(total)}</span>
            <span className="muted"> of {usd(mandate.budget)}</span>
          </p>
        </div>

        <div className="sim-bar" aria-hidden="true">
          <motion.span
            style={{ background: over ? "var(--block)" : "var(--t-hot)" }}
            initial={false}
            animate={{ width: `${fill * 100}%` }}
            transition={{ type: "spring", bounce: over ? 0.3 : 0, duration: 0.5 }}
          />
          <i style={{ left: `${(1 / 1.2) * 100}%` }} />
        </div>

        <ul className="rows small" style={{ marginTop: 16 }}>
          {POLICY_RULES.map((rule) => {
            const ok = !cart.length || checks[rule.name];
            return (
              <li key={rule.name} className="flex items-center justify-between" style={{ padding: "8px 0" }}>
                <span>{rule.name}</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={ok ? "ok" : "bad"}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={SPRING}
                    className={`chip ${!cart.length ? "" : ok ? "chip-pass" : "chip-block"}`}
                  >
                    {!cart.length ? "Waiting" : ok ? <><Check size={12} /> Pass</> : <><X size={12} /> {rule.reason}</>}
                  </motion.span>
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={verdict ? (verdict.allowed ? "yes" : verdict.reason) : "empty"}
            className={`note ${verdict ? (verdict.allowed ? "note-pass" : "note-block") : ""}`}
            style={{ marginTop: 14, ...(verdict ? {} : { background: "var(--surface)" }) }}
            initial={{ opacity: 0, y: 8 }}
            animate={verdict && !verdict.allowed ? { opacity: 1, y: 0, x: [0, -6, 5, -3, 0] } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            aria-live="polite"
          >
            {!verdict ? (
              "Add a product to run the policy engine."
            ) : verdict.allowed ? (
              <>
                <ShieldCheck size={16} style={{ flex: "none", marginTop: 2 }} /> The engine allows this cart: {usd(verdict.total)}. In the shop it would wait for your PayPal approval.
              </>
            ) : (
              <>
                <ShieldAlert size={16} style={{ flex: "none", marginTop: 2 }} /> The engine blocks this cart: {verdict.reason}
              </>
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
