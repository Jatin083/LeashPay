"use client";

import { motion } from "motion/react";

/*
  Next.js remounts a template on every navigation, so this runs once per page change:
  the new page fades and sharpens in while a thin accent bar sweeps across the top.
  No movement on the content itself, so GSAP measures pinned sections in their real place.
*/
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.span
        aria-hidden="true"
        className="route-bar"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ scaleX: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.3, delay: 0.55 } }}
      />
      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)" }}
        // A filter left on an ancestor (even blur(0px)) becomes the containing block for
        // position: fixed and would break GSAP's pinned sections, so it ends as "none".
        animate={{ opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
