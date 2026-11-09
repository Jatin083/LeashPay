import Link from "next/link";
import BrandMark from "./BrandMark";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/rules", label: "Rules" },
  { href: "/orders", label: "Orders" },
];

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)" }}>
      <div className="wrap" style={{ paddingBlock: "40px" }}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Link href="/" className="brand" aria-label="LeashPay home">
            <BrandMark />
            LeashPay
          </Link>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link className="link small muted" href={link.href} style={{ display: "inline-flex", minHeight: 44, alignItems: "center" }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="small muted" style={{ margin: "24px 0 0" }}>
          Built for the PayPal AI Hackathon 2026. Payments run in PayPal Sandbox, so no real money moves.
        </p>
      </div>
    </footer>
  );
}
