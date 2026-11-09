"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Palette } from "lucide-react";
import { THEMES } from "@/lib/themes";
import { useTheme } from "@/lib/useTheme";

const SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;

/** A palette button in the nav. Opens a menu of the site's themes; picking one restyles the whole site. */
export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    // Focus the current theme when the menu opens.
    root.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onMenuKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <div ref={root} style={{ position: "relative" }}>
      <motion.button
        ref={button}
        type="button"
        className="icon-btn"
        aria-label={`Theme: ${theme.name}. Change theme`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.9 }}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={SPRING} style={{ display: "inline-flex" }}>
          <Palette size={18} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Choose a theme"
            className="theme-menu"
            onKeyDown={onMenuKey}
            // Grows out of the button that opened it.
            style={{ transformOrigin: "top right" }}
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.12 } }}
            transition={SPRING}
          >
            <p className="small" style={{ margin: "4px 10px 8px", color: "#6b7085" }}>
              Theme
            </p>
            {THEMES.map((t, i) => {
              const active = t.id === theme.id;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  className="theme-item"
                  onClick={() => setTheme(t.id)}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING, delay: 0.03 * i }}
                >
                  <span className="theme-swatch" aria-hidden="true">
                    <i style={{ background: t.deep.bg }} />
                    <i style={{ background: t.page.bg }} />
                    <i style={{ background: t.hot }} />
                  </span>
                  <span style={{ flex: 1, textAlign: "left" }}>
                    <span style={{ display: "block", fontWeight: 600 }}>
                      {t.name}
                      {i === 0 && <span className="theme-tag">New</span>}
                    </span>
                    <span className="small" style={{ color: "#6b7085" }}>
                      {t.note}
                    </span>
                  </span>
                  {active && (
                    <motion.span layoutId="theme-check" transition={SPRING} style={{ display: "inline-flex" }}>
                      <Check size={16} />
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
