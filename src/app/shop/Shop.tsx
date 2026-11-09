"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { Check, Loader2, Minus, Plus, Star, Trash2 } from "lucide-react";
import Agent, { type CartItem } from "./Agent";

const SPRING = { type: "spring", bounce: 0, duration: 0.45 } as const;

/** A price that rolls to its new value instead of jumping. */
function AnimatedPrice({ cents }: { cents: number }) {
  const value = useSpring(cents, { bounce: 0, duration: 600 });
  const text = useTransform(value, (v) => usd(Math.round(v)));
  useEffect(() => {
    value.set(cents);
  }, [cents, value]);
  return <motion.span className="num">{text}</motion.span>;
}

/** Add to cart, with a short "Added" confirmation that names what changed. */
function AddButton({ onAdd, disabled, name }: { onAdd: () => void; disabled: boolean; name: string }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1200);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <motion.button
      type="button"
      className="btn btn-quiet"
      disabled={disabled}
      aria-label={`Add ${name} to cart`}
      onClick={() => {
        onAdd();
        setAdded(true);
      }}
      whileTap={{ scale: 0.95 }}
      style={{ minWidth: 128, overflow: "hidden" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={added ? "added" : "add"}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={SPRING}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: added ? "var(--accent)" : undefined }}
        >
          {added ? (
            <>
              <Check size={16} aria-hidden="true" /> Added
            </>
          ) : (
            "Add to cart"
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: "USD";
  stock: number;
  rating: number;
  description: string;
};

type Mandate = { budget: number; allowedCategories: string[]; maxQuantity: number } | null;

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function Shop({ products, mandate }: { products: Product[]; mandate: Mandate }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const lines = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return product ? { ...product, quantity: item.quantity } : null;
        })
        .filter((line) => line !== null),
    [cart, products]
  );

  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function resetNotes() {
    setError("");
    setMessage("");
  }

  function addToCart(product: Product) {
    resetNotes();
    setCart((previous) =>
      previous.some((item) => item.productId === product.id)
        ? previous.map((item) =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...previous, { productId: product.id, quantity: 1 }]
    );
  }

  function changeQuantity(productId: string, change: number) {
    resetNotes();
    setCart((previous) =>
      previous
        .map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + change } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  async function checkout() {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    resetNotes();

    try {
      const payload = JSON.stringify({ items: cart });
      const headers = { "Content-Type": "application/json" };

      // The server checks the rules again inside create-order; this first call gives a fast answer.
      const validation = await fetch("/api/checkout/validate", { method: "POST", headers, body: payload });
      const checked = await validation.json();
      if (!validation.ok || !checked.allowed) {
        throw new Error(checked.reason || checked.error || "Your spending rules blocked this cart");
      }

      const orderResponse = await fetch("/api/paypal/create-order", { method: "POST", headers, body: payload });
      const order = await orderResponse.json();
      if (!orderResponse.ok || !order.approvalUrl) {
        throw new Error(order.reason || order.error || "PayPal could not create the order");
      }

      window.location.assign(order.approvalUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setCheckoutLoading(false);
    }
  }

  return (
    <>
      <section className="wrap" style={{ paddingBlock: "48px 28px" }} aria-labelledby="shop-h">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 id="shop-h" className="h1" style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)" }}>
              Shop with your agent
            </h1>
            <p className="lede" style={{ marginTop: 12 }}>
              Ask for what you need. Every cart is checked against your rules before PayPal sees it.
            </p>
          </div>
          {mandate && (
            <ul className="flex flex-wrap gap-2" style={{ listStyle: "none", margin: 0, padding: 0 }} aria-label="Your spending rules">
              <li className="chip">Budget {usd(mandate.budget)}</li>
              <li className="chip">{mandate.allowedCategories.join(" and ")}</li>
              <li className="chip">Up to {mandate.maxQuantity} items</li>
              <li className="chip">PayPal approval required</li>
            </ul>
          )}
        </div>
      </section>

      <div className="wrap grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:items-start" style={{ paddingBottom: 72 }}>
        <Agent
          onCartProposed={(items) => {
            setError("");
            setMessage("Your agent proposed this cart. Review it, then approve payment on PayPal.");
            setCart(items);
          }}
        />

        <aside className="card lg:sticky" style={{ top: "calc(var(--nav-h) + 20px)", padding: 22 }} aria-labelledby="cart-h">
          <div className="flex items-baseline justify-between">
            <h2 id="cart-h" className="h3">
              Your cart
            </h2>
            <span className="small muted" aria-live="polite">
              {/* The count pops each time it changes. */}
              <motion.span
                key={itemCount}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
                style={{ display: "inline-block" }}
              >
                {itemCount}
              </motion.span>{" "}
              {itemCount === 1 ? "item" : "items"}
            </span>
          </div>

          {mandate && <BudgetLeash total={total} budget={mandate.budget} />}

          {lines.length === 0 ? (
            <p className="muted" style={{ margin: "20px 0 4px" }}>
              Empty. Ask the agent for something, or add a product from the catalog.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0 }}>
              <AnimatePresence initial={false}>
              {lines.map((line) => (
                <motion.li
                  key={line.id}
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
                  transition={SPRING}
                  style={{ padding: "14px 0", borderBottom: "1px solid var(--line)" }}
                >
                  <div className="flex justify-between gap-3">
                    <p style={{ margin: 0, fontWeight: 600 }}>{line.name}</p>
                    <button
                      type="button"
                      onClick={() => changeQuantity(line.id, -line.quantity)}
                      aria-label={`Remove ${line.name}`}
                      className="muted"
                      style={{ background: "none", border: 0, cursor: "pointer", minWidth: 32, minHeight: 32 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                    <span className="muted">{usd(line.price * line.quantity)}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn btn-quiet" style={qtyBtn} onClick={() => changeQuantity(line.id, -1)} aria-label={`One less ${line.name}`}>
                        <Minus size={14} />
                      </button>
                      <span style={{ minWidth: 20, textAlign: "center", overflow: "hidden", display: "inline-block" }}>
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={line.quantity}
                            initial={{ y: 12, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -12, opacity: 0 }}
                            transition={SPRING}
                            style={{ display: "inline-block" }}
                          >
                            {line.quantity}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                      <button type="button" className="btn btn-quiet" style={qtyBtn} onClick={() => changeQuantity(line.id, 1)} aria-label={`One more ${line.name}`}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
              </AnimatePresence>
            </ul>
          )}

          <div className="flex items-baseline justify-between" style={{ marginTop: 18 }}>
            <span className="muted">Total</span>
            <span className="display" style={{ fontSize: "1.9rem", fontWeight: 500, letterSpacing: "-0.02em" }}>
              <AnimatedPrice cents={total} />
            </span>
          </div>

          <button type="button" onClick={checkout} disabled={checkoutLoading || cart.length === 0} className="btn" style={{ width: "100%", marginTop: 16 }}>
            {checkoutLoading ? (
              <>
                <Loader2 size={17} className="animate-spin" aria-hidden="true" /> Checking your rules
              </>
            ) : (
              "Pay with PayPal"
            )}
          </button>
          <p className="small muted" style={{ margin: "10px 0 0", textAlign: "center" }}>
            You approve the payment on PayPal. Sandbox only.
          </p>

          {error && (
            <p role="alert" style={{ margin: "14px 0 0", padding: "11px 14px", borderRadius: 10, background: "var(--block-soft)", color: "var(--block)", fontWeight: 600 }}>
              {error}
            </p>
          )}
          {message && !error && (
            <p style={{ margin: "14px 0 0", color: "var(--accent)" }} className="small">
              {message}
            </p>
          )}
        </aside>
      </div>

      <section className="surface" aria-labelledby="catalog-h" style={{ paddingBlock: 72 }}>
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="catalog-h" className="h2">
              Catalog
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {products.length} products, priced from the database
            </p>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ listStyle: "none", margin: "36px 0 0", padding: 0 }}>
            {products.map((product) => {
              const outside = mandate ? !mandate.allowedCategories.includes(product.category) || product.price > mandate.budget : false;
              return (
                <motion.li
                  key={product.id}
                  className="card"
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                  whileHover={{ y: -3, boxShadow: "0 18px 36px -24px rgba(10,10,10,0.35)" }}
                  transition={SPRING}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="chip">{product.category}</span>
                    <span className="small" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Star size={14} fill="var(--ink)" color="var(--ink)" aria-hidden="true" />
                      {product.rating}
                    </span>
                  </div>
                  <div>
                    <h3 className="h3">{product.name}</h3>
                    <p className="muted small" style={{ margin: "6px 0 0" }}>
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-3" style={{ marginTop: "auto" }}>
                    <div>
                      <p className="display" style={{ margin: 0, fontSize: "2rem", fontWeight: 500, letterSpacing: "-0.03em"}}>
                        {usd(product.price)}
                      </p>
                      <p className="small" style={{ margin: 0, color: outside ? "var(--block)" : "var(--muted)" }}>
                        {outside ? "Outside your rules" : `${product.stock} in stock`}
                      </p>
                    </div>
                    <AddButton onAdd={() => addToCart(product)} disabled={product.stock === 0} name={product.name} />
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}

const qtyBtn = { minHeight: 32, width: 32, padding: 0 } as const;

/** The cart's leash: fills toward the budget clip and pulls red past it. */
function BudgetLeash({ total, budget }: { total: number; budget: number }) {
  const ratio = Math.min(total / budget, 1.15);
  const over = total > budget;

  return (
    <div style={{ marginTop: 16 }} aria-label={`${usd(total)} of your ${usd(budget)} budget`} role="img">
      <div style={{ position: "relative", height: 10, borderRadius: 10, background: "var(--surface)" }}>
        {/* Fills with a spring; past the budget it overshoots a little, like a pulled leash. */}
        <motion.div
          style={{
            position: "absolute",
            inset: "0 auto 0 0",
            borderRadius: 10,
            background: over ? "var(--block)" : "var(--marigold)",
            transition: "background-color 260ms ease",
          }}
          initial={false}
          animate={{ width: `${(ratio / 1.15) * 100}%` }}
          transition={{ type: "spring", bounce: over ? 0.35 : 0, duration: 0.6 }}
        />
        <span
          aria-hidden="true"
          style={{ position: "absolute", left: `${(1 / 1.15) * 100}%`, top: -4, width: 4, height: 18, borderRadius: 2, background: "var(--ink)", transform: "translateX(-2px)" }}
        />
      </div>
      <p className="small" style={{ margin: "8px 0 0", color: over ? "var(--block)" : "var(--muted)", fontWeight: over ? 600 : 400 }}>
        {over ? `${usd(total - budget)} over your budget. Checkout will be blocked.` : `${usd(budget - total)} left of ${usd(budget)}`}
      </p>
    </div>
  );
}
