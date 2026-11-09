"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type Status = "processing" | "success" | "error";

export default function CaptureStatus({ orderId }: { orderId: string | null }) {
  const [status, setStatus] = useState<Status>(orderId ? "processing" : "error");
  const [message, setMessage] = useState(
    orderId ? "Verifying your PayPal payment..." : "PayPal order ID was not found."
  );
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Payment capture could not be verified.");
        }
        if (cancelled) return;
        setStatus("success");
        setMessage("Payment completed successfully!");
        setDetails(
          data.captureId
            ? `${data.currency} ${data.amount} · Capture ID: ${data.captureId}`
            : `${data.currency} ${data.amount}`
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to verify payment.");
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <section className="screen center" aria-labelledby="return-h">
      <div className="wrap" aria-live="polite">
        {status === "processing" && (
          <Loader2 className="animate-spin" size={40} style={{ margin: "0 auto", color: "var(--muted)" }} aria-hidden="true" />
        )}
        {status === "success" && <CheckCircle2 size={44} style={{ margin: "0 auto", color: "var(--accent)" }} aria-hidden="true" />}
        {status === "error" && <XCircle size={44} style={{ margin: "0 auto", color: "var(--block)" }} aria-hidden="true" />}

        <h1 id="return-h" className="h2" style={{ marginTop: 20 }}>
          {status === "success" ? "Payment complete" : status === "error" ? "Payment not confirmed" : "Confirming your payment"}
        </h1>
        <p className="lede" style={{ marginTop: 12 }}>
          {message}
        </p>

        {details && (
          <p className="small muted code" style={{ marginTop: 16, wordBreak: "break-all" }}>
            {details}
          </p>
        )}

        {status !== "processing" && (
          <div className="flex flex-wrap justify-center gap-3" style={{ marginTop: 28 }}>
            <Link href="/orders" className="btn">
              See your orders
            </Link>
            <Link href="/shop" className="btn btn-quiet">
              Back to the shop
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
