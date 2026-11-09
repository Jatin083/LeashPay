import { NextRequest, NextResponse } from "next/server";
import { checkCart } from "@/lib/spending";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
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

    return NextResponse.json({
      allowed: true,
      total: check.result.total,
      currency: "USD",
      approvalRequired: true,
      message: "Cart passed spending policy. Awaiting PayPal checkout.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to validate checkout" },
      { status: 500 }
    );
  }
}
