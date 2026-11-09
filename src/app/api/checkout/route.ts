import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "LeashPay checkout API",
    status: "ready"
  });
}