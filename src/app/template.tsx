"use client";

import { useState } from "react";
import { motion } from "motion/react";

// True only until the first page has mounted. The first load shows the server HTML
// immediately; only later page changes fade in.
let firstLoad = true;

/*
  Next.js remounts a template on every navigation, so this runs once per page change:
  the new page fades in quickly while a thin accent bar sweeps across the top.
  Opacity only: no blur or movement, which keeps it cheap and lets GSAP measure
  pinned sections in their real place.
*/
export default function Template({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => {
    // On the server, never animate: its module state is shared by every request, and the
    // HTML it sends must match the browser's first render (no fade on first load).
    if (typeof window === "undefined") return false;
    const isNavigation = !firstLoad;
    firstLoad = false;
    return isNavigation;
  });

  return (
    <>
      {animate && (
        <motion.span
          aria-hidden="true"
          className="route-bar"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ scaleX: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.25, delay: 0.4 } }}
        />
      )}
      <motion.div
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
