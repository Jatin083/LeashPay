import Link from "next/link";

/**
 * A link styled as a "star border" button: a light runs around its edge, in the theme's colours.
 * Pure CSS (globals.css, ".btn-star"): a rotating conic gradient, masked to a thin border.
 * It replaces the React Bits StarBorder, which redrew a canvas on every frame.
 */
export default function StarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="btn-star">
      <span>{children}</span>
    </Link>
  );
}
