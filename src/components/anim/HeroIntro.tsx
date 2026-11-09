"use client";

import { Fragment, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/**
 * The hero's one entrance, played once on load:
 * headline words rise out of their line boxes, then the rest settles in,
 * then the product window lifts into place.
 *   data-hero="pill" | "lede" | "actions" | "window"
 * Headline words come from <SplitWords>.
 */
export default function HeroIntro({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(ref);
      const all = q("[data-hero], .word-inner");
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .set(all, { visibility: "visible" })
          .from(q('[data-hero="pill"]'), { y: 12, autoAlpha: 0, duration: 0.8 })
          .from(q(".word-inner"), { yPercent: 110, duration: 1.1, stagger: 0.055 }, 0.08)
          .from(q('[data-hero="lede"]'), { y: 18, autoAlpha: 0, duration: 1 }, 0.45)
          // Animate the button row as one block: the buttons' own CSS transform transition
          // (their press feedback) fights a tween on the buttons themselves and can freeze one mid-way.
          .from(q('[data-hero="actions"]'), { y: 14, autoAlpha: 0, duration: 0.9, clearProps: "transform" }, 0.55)
          .from(q('[data-hero="window"]'), { y: 60, scale: 0.96, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, 0.6);
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(all, { visibility: "visible" });
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

/** Splits a headline into words that can rise out of their own line box. */
export function SplitWords({ text, accentFrom }: { text: string; accentFrom?: number }) {
  return (
    <>
      {text.split(" ").map((word, i, words) => (
        // The space sits outside the inline-block, or the browser collapses it.
        <Fragment key={i}>
          <span className="word">
            <span className={`word-inner${accentFrom !== undefined && i >= accentFrom ? " accent-word" : ""}`}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
