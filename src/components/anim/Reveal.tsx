"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * One GSAP timeline per section, played once when the section comes into view.
 * Mark children with:
 *   data-reveal  rises into place (headings, ledes)
 *   data-line    a rule that draws from left to right
 *   data-pop     a small chip or badge that pops in
 */
export default function Reveal({
  children,
  className,
  style,
  start = "top 78%",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(ref);
        const items = q("[data-reveal]");
        const lines = q("[data-line]");
        const pops = q("[data-pop]");

        const tl = gsap.timeline({
          scrollTrigger: { trigger: ref.current, start, once: true },
          defaults: { ease: "expo.out" },
        });

        if (items.length) tl.from(items, { y: 28, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0);
        if (lines.length)
          tl.from(lines, { scaleX: 0, transformOrigin: "left center", duration: 1.2, ease: "expo.inOut", stagger: 0.1 }, 0.05);
        if (pops.length) tl.from(pops, { scale: 0.7, autoAlpha: 0, duration: 0.6, ease: "back.out(2.2)", stagger: 0.04 }, 0.25);
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
