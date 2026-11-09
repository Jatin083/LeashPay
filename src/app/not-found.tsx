import Link from "next/link";
import DrawLeash from "@/components/DrawLeash";

export default function NotFound() {
  return (
    <section className="center dark hero-mesh" style={{ minHeight: "calc(100svh - var(--nav-h))", display: "flex", alignItems: "center" }}>
      <div className="wrap">
        <p className="num" style={{ margin: 0, fontSize: "clamp(80px, 14vw, 180px)", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.06em", color: "var(--t-hot)" }}>
          404
        </p>
        <h1 className="h2" style={{ marginTop: 16 }}>
          This page slipped its leash
        </h1>
        <p className="lede" style={{ marginTop: 16 }}>
          There&apos;s nothing at this address. The shop and your rules are where you left them.
        </p>
        <div style={{ marginTop: 32 }}>
          <DrawLeash />
        </div>
        <div className="flex flex-wrap justify-center gap-3" style={{ marginTop: 32 }}>
          <Link href="/" className="btn">
            Go to the home page
          </Link>
          <Link href="/shop" className="btn btn-quiet">
            Open the shop
          </Link>
        </div>
      </div>
    </section>
  );
}
