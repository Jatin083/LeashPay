
import { connection, NextResponse } from "next/server";
import { getPayPalAccessToken } from "@/lib/paypal";


export async function GET() {
  await connection();
  try {
    await getPayPalAccessToken();

    return NextResponse.json({
      success: true,
      message: "PayPal Sandbox authentication successful",
      environment: "Sandbox",
    });
  } catch (error) {
    console.error("PayPal test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "PayPal Sandbox authentication failed",
      },
      { status: 502 }
    );
  }
}
