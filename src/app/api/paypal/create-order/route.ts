import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken, PAYPAL_BASE_URL } from "@/lib/paypal";
import { insertPendingOrder } from "@/lib/db";
import { CartSchema } from "@/lib/policy";
import { checkCart } from "@/lib/spending";

type PayPalLink = { href: string; rel: string };

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    // Re-run the spending policy here. Never trust an earlier validate call
    // or any amount sent by the browser: the total comes from the database.
    const check = checkCart(body);

    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: check.status });
    }

    if (!check.result.allowed) {
      return NextResponse.json(
        { allowed: false, reason: check.result.reason },
        { status: 403 }
      );
    }

    const cart = CartSchema.parse(body);
    const total = check.result.total;
    const value = (total / 100).toFixed(2);
    const appUrl = process.env.APP_URL || request.nextUrl.origin;

    const description = cart.items
      .map((item) => {
        const product = check.products.find((p) => p.id === item.productId);
        return `${item.quantity} x ${product?.name ?? item.productId}`;
      })
      .join(", ")
      .slice(0, 127);

    // The cart rides along with the PayPal order, so capture can rebuild the order on a
    // server instance that never saw it (serverless hosts). Capture re-prices it from the database.
    const cartTag = cart.items.map((item) => `${item.productId}:${item.quantity}`).join(",");

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "PayPal-Request-Id": `create-${randomUUID()}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description,
            ...(cartTag.length <= 127 ? { custom_id: cartTag } : {}),
            amount: { currency_code: "USD", value },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "LeashPay",
              user_action: "PAY_NOW",
              shipping_preference: "NO_SHIPPING",
              return_url: `${appUrl}/checkout/return`,
              cancel_url: `${appUrl}/checkout/cancel`,
            },
          },
        },
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || typeof data.id !== "string") {
      console.error("PayPal create order failed:", {
        status: response.status,
        message: data.message,
        details: data.details,
      });

      return NextResponse.json(
        { error: "PayPal could not create this order" },
        { status: 502 }
      );
    }

    const links: PayPalLink[] = Array.isArray(data.links) ? data.links : [];
    const approvalUrl = links.find(
      (link) => link.rel === "payer-action" || link.rel === "approve"
    )?.href;

    if (!approvalUrl) {
      return NextResponse.json(
        { error: "PayPal did not return an approval link" },
        { status: 502 }
      );
    }

    insertPendingOrder({
      paypalOrderId: data.id,
      total,
      currency: "USD",
      items: cart.items,
    });

    return NextResponse.json({
      orderId: data.id,
      approvalUrl,
      total,
      currency: "USD",
    });
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      { error: "Unable to create PayPal order" },
      { status: 500 }
    );
  }
}
