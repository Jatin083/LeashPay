"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionConfig } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

/** The running Lenis instance, so the custom scroll rail can drive the same smooth scroll. */
let lenisInstance: Lenis | null = null;
export function getLenis() {
  return lenisInstance;
}

/**
 * Lenis drives the scroll, GSAP's ticker drives Lenis, and ScrollTrigger reads
 * Lenis's position, so every scroll moment stays in sync. Off under reduced motion.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Smooth scrolling only helps a mouse wheel; on touch screens it just costs a frame loop.
    if (window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;

    const lenis = new Lenis({ lerp: 0.11, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    lenisInstance = lenis;

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  // New page: start at the top, then reveal [data-auto-reveal] blocks in batches as they
  // scroll into view. Anything already on screen plays at once.
  useEffect(() => {
    window.scrollTo(0, 0);
    const mm = gsap.matchMedia();
    const id = requestAnimationFrame(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = gsap.utils.toArray<HTMLElement>("[data-auto-reveal]");
        if (!targets.length) return;
        gsap.set(targets, { autoAlpha: 0, y: 24 });
        ScrollTrigger.batch(targets, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.07, overwrite: true }),
        });
      });
      ScrollTrigger.refresh();
    });
    return () => {
      cancelAnimationFrame(id);
      mm.revert();
    };
  }, [pathname]);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
