import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCatalogProducts, getRecentOrders } from "@/lib/db";

export const metadata: Metadata = {
  title: "Orders",
  description: "Every PayPal Sandbox order LeashPay created, with its status and checked total.",
};

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const STATUS: Record<string, { label: string; tone: string }> = {
  COMPLETED: { label: "Paid", tone: "chip-pass" },
  PENDING: { label: "Waiting for your approval", tone: "" },
  CAPTURING: { label: "Confirming with PayPal", tone: "" },
  REVIEW_REQUIRED: { label: "Needs review", tone: "chip-block" },
};

function describeItems(raw: string, names: Map<string, string>) {
  try {
    const items = JSON.parse(raw) as Array<{ productId: string; quantity: number }>;
    if (!Array.isArray(items) || items.length === 0) return "Items not recorded";
    return items.map((i) => `${i.quantity} × ${names.get(i.productId) ?? i.productId}`).join(", ");
  } catch {
    return "Items not recorded";
  }
}

async function OrderList() {
  await connection();
  const orders = getRecentOrders();
  const names = new Map(
    (getCatalogProducts() as Array<{ id: string; name: string }>).map((p) => [p.id, p.name])
  );

  if (orders.length === 0) {
    return (
      <div className="card" style={{ marginTop: 48, padding: 40 }}>
        <p className="h3">No orders yet</p>
        <p className="muted" style={{ margin: "8px 0 24px" }}>
          Ask the agent for something in the shop. Orders appear here as soon as PayPal creates them.
        </p>
        <Link href="/shop" className="btn">
          Open the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 48, padding: 0, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
        <thead>
          <tr className="small muted" style={{ textAlign: "left" }}>
            <th style={th}>Order</th>
            <th style={th}>Items</th>
            <th style={th}>Status</th>
            <th style={{ ...th, textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const status = STATUS[order.status] ?? { label: order.status, tone: "" };
            return (
              <tr key={order.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={td}>
                  <span className="code">{order.paypal_order_id}</span>
                  <span className="small muted" style={{ display: "block" }}>
                    {new Date(`${order.created_at}Z`).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </td>
                <td style={td}>{describeItems(order.items, names)}</td>
                <td style={td}>
                  <span className={`chip ${status.tone}`}>{status.label}</span>
                </td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{usd(order.total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: "14px 20px", fontWeight: 500 } as const;
const td = { padding: "16px 20px", verticalAlign: "top" } as const;

export default function OrdersPage() {
  return (
    <section className="screen" style={{ alignItems: "flex-start" }} aria-labelledby="orders-h">
      <div className="wrap">
        <h1 id="orders-h" className="h1">
          Orders
        </h1>
        <p className="lede" style={{ marginTop: 16 }}>
          Every PayPal Sandbox order LeashPay created, newest first. Totals are the checked amounts saved
          before PayPal saw them.
        </p>
        <Suspense fallback={<div style={{ height: 200, marginTop: 48 }} />}>
          <OrderList />
        </Suspense>
      </div>
    </section>
  );
}
