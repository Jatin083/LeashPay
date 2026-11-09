import { ImageResponse } from "next/og";

// The share card for links (Devpost, X, LinkedIn): the Klein theme, the product line, the one fact.
export const alt = "LeashPay: an AI shopping agent that can't overspend";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#ffffff",
          background:
            "radial-gradient(60% 70% at 15% 15%, #5f6dff 0%, transparent 70%), radial-gradient(50% 60% at 85% 90%, rgba(200,245,58,0.45) 0%, transparent 70%), #1b2bf5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 700 }}>
          <div style={{ display: "flex", width: 56, height: 56, borderRadius: 14, background: "#c8f53a" }} />
          LeashPay
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>
          <span>An AI shopping agent</span>
          <span style={{ color: "#c8f53a" }}>that can&apos;t overspend</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#cfd3ff" }}>
          Claude builds the cart. Code enforces your budget. You approve on PayPal.
        </div>
      </div>
    ),
    size
  );
}
