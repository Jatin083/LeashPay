
import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken, PAYPAL_BASE_URL } from "@/lib/paypal";
import db, { insertPendingOrder } from "@/lib/db";
import { checkCart } from "@/lib/spending";

type SavedOrder = {
  paypal_order_id: string;
  status: string;
  total: number;
  currency: string;
};

export async function POST(request: NextRequest) {
  let orderId: string | undefined;
  let claimed = false;

  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("orderId" in body) ||
      typeof body.orderId !== "string" ||
      !/^[A-Z0-9-]{1,64}$/i.test(body.orderId)
    ) {
      return NextResponse.json(
        { error: "Invalid PayPal order ID" },
        { status: 400 }
      );
    }

    orderId = body.orderId;

    let savedOrder = db.prepare(`
      SELECT paypal_order_id, status, total, currency
      FROM orders
      WHERE paypal_order_id = ?
    `).get(orderId) as SavedOrder | undefined;

    // On a serverless host this instance may not have the order. Rebuild it from PayPal,
    // re-pricing the cart from our own database, before anything is captured.
    if (!savedOrder) {
      savedOrder = await recoverOrder(orderId);
    }

    if (!savedOrder) {
      return NextResponse.json(
        { error: "Order not found in LeashPay" },
        { status: 404 }
      );
    }

    if (savedOrder.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        orderId,
        status: "COMPLETED",
        amount: (savedOrder.total / 100).toFixed(2),
        currency: savedOrder.currency,
        message: "Order was already completed",
      });
    }

    // Atomically claim this order for one capture request.
    const claim = db.prepare(`
      UPDATE orders
      SET status = 'CAPTURING'
      WHERE paypal_order_id = ?
      AND status = 'PENDING'
    `).run(orderId);

    if (claim.changes !== 1) {
      return NextResponse.json(
        { error: "Order is already being processed or cannot be captured" },
        { status: 409 }
      );
    }

    claimed = true;

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "PayPal-Request-Id": `capture-${orderId}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({}),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("PayPal capture failed:", {
        status: response.status,
        message: data.message,
        details: data.details,
      });

      // Allow a retry using the same PayPal idempotency key.
      db.prepare(`
        UPDATE orders
        SET status = 'PENDING'
        WHERE paypal_order_id = ?
        AND status = 'CAPTURING'
      `).run(orderId);

      claimed = false;

      return NextResponse.json(
        { error: "PayPal could not capture this payment" },
        { status: 502 }
      );
    }

    const capture =
      data.purchase_units?.[0]?.payments?.captures?.[0];

    if (
      data.id !== orderId ||
      data.status !== "COMPLETED" ||
      capture?.status !== "COMPLETED"
    ) {
      db.prepare(`
        UPDATE orders
        SET status = 'REVIEW_REQUIRED'
        WHERE paypal_order_id = ?
        AND status = 'CAPTURING'
      `).run(orderId);

      claimed = false;

      return NextResponse.json(
        { error: "PayPal payment is not completed" },
        { status: 409 }
      );
    }

    const expectedAmount = (savedOrder.total / 100).toFixed(2);
    const capturedAmount = capture.amount?.value;
    const capturedCurrency = capture.amount?.currency_code;

    if (
      capturedAmount !== expectedAmount ||
      capturedCurrency !== savedOrder.currency
    ) {
      db.prepare(`
        UPDATE orders
        SET status = 'REVIEW_REQUIRED'
        WHERE paypal_order_id = ?
        AND status = 'CAPTURING'
      `).run(orderId);

      claimed = false;

      return NextResponse.json(
        { error: "Payment amount verification failed" },
        { status: 409 }
      );
    }

    const update = db.prepare(`
      UPDATE orders
      SET status = 'COMPLETED'
      WHERE paypal_order_id = ?
      AND status = 'CAPTURING'
    `).run(orderId);

    claimed = false;

    if (update.changes !== 1) {
      return NextResponse.json(
        { error: "Unable to finalize order status" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      captureId: capture.id,
      status: "COMPLETED",
      amount: capturedAmount,
      currency: capturedCurrency,
      message: "Payment captured and verified successfully",
    });
  } catch (error) {
    console.error("Capture order error:", error);

    if (claimed && orderId) {
      db.prepare(`
        UPDATE orders
        SET status = 'PENDING'
        WHERE paypal_order_id = ?
        AND status = 'CAPTURING'
      `).run(orderId);
    }

    return NextResponse.json(
      { error: "Unable to capture PayPal order" },
      { status: 500 }
    );
  }
}

/**
 * Rebuilds a PENDING order this server instance has never seen, from the PayPal order itself.
 * Trusts nothing from PayPal except which cart was ordered: the cart is priced again from the
 * database and run through every spending rule, and PayPal's amount must match that total exactly.
 */
async function recoverOrder(orderId: string): Promise<SavedOrder | undefined> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return undefined;

  const order = await response.json();
  const unit = order.purchase_units?.[0];
  const tag: unknown = unit?.custom_id;
  if (order.status !== "APPROVED" || typeof tag !== "string" || !/^([a-z0-9-]+:\d{1,2})(,[a-z0-9-]+:\d{1,2})*$/i.test(tag)) {
    return undefined;
  }

  const items = tag.split(",").map((pair) => {
    const [productId, quantity] = pair.split(":");
    return { productId, quantity: Number(quantity) };
  });

  const check = checkCart({ items });
  if (!check.ok || !check.result.allowed) return undefined;

  const total = check.result.total;
  if (unit.amount?.currency_code !== "USD" || unit.amount?.value !== (total / 100).toFixed(2)) {
    return undefined;
  }

  insertPendingOrder({ paypalOrderId: orderId, total, currency: "USD", items });
  return { paypal_order_id: orderId, status: "PENDING", total, currency: "USD" };
}
