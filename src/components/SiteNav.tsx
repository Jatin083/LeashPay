"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import BrandMark from "./BrandMark";
import GitHubLink from "./GitHubLink";
import ThemePicker from "./ThemePicker";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/rules", label: "Rules" },
  { href: "/orders", label: "Orders" },
];

// Critically damped: quick, no overshoot.
const SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  // Close the menu when the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="nav dark">
      <div className="wrap nav-inner">
        <Link href="/" className="brand" aria-label="LeashPay home">
          <motion.span whileHover={{ rotate: -12 }} whileTap={{ scale: 0.9 }} transition={SPRING} style={{ display: "inline-flex" }}>
            <BrandMark />
          </motion.span>
          LeashPay
        </Link>

        <nav aria-label="Main" onMouseLeave={() => setHovered(null)}>
          <ul className="nav-links">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href} style={{ position: "relative" }} onMouseEnter={() => setHovered(link.href)}>
                  {/* One pill slides between links under the pointer. */}
                  {hovered === link.href && (
                    <motion.span
                      layoutId="nav-hover"
                      transition={SPRING}
                      aria-hidden="true"
                      style={{ position: "absolute", inset: "6px 0", borderRadius: 999, background: "rgba(239,232,218,0.09)" }}
                    />
                  )}
                  <Link href={link.href} className="nav-link" aria-current={active ? "page" : undefined} style={{ position: "relative" }}>
                    {link.label}
                  </Link>
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      transition={SPRING}
                      aria-hidden="true"
                      style={{ position: "absolute", left: 12, right: 12, bottom: 4, height: 2, borderRadius: 2, background: "var(--accent)" }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="nav-tools">
          <GitHubLink />
          <ThemePicker />
          <Link href="/shop" className="btn nav-cta" style={{ minHeight: 36, padding: "0 14px", fontSize: 14, marginLeft: 8 }}>
            Open the shop
          </Link>

        <motion.button
          type="button"
          className="menu-btn"
          aria-expanded={open}
          aria-controls="menu-sheet"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "x" : "menu"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: "inline-flex" }}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu-sheet"
            className="menu-sheet"
            aria-label="Menu"
            style={{ animation: "none" }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING}
          >
            {[{ href: "/", label: "Home" }, ...LINKS].map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.04 * i }}
              >
                <Link href={link.href}>{link.label}</Link>
              </motion.div>
            ))}
            <Link href="/shop" className="btn" style={{ marginTop: 28, minHeight: 52 }}>
              Open the shop
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
