"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, useGSAP);

const PATH = "M 25 30 C 160 72, 300 -10, 440 34 S 560 36, 576 30";

/**
 * The closing section's moment. As you scroll through the section the leash draws
 * from the handle, and the clip rides the tip of the line until it lands at the end.
 * Under reduced motion it is simply drawn.
 */
export default function DrawLeash() {
  const ref = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg) return;
      const line = svg.querySelector<SVGPathElement>(".leash-line");
      const clip = svg.querySelector<SVGGElement>(".leash-clip");
      if (!line || !clip) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Real length, butt caps while drawing: no stray dot before the line starts.
        const length = line.getTotalLength();
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: length, strokeLinecap: "butt" });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: svg, start: "top 92%", end: "top 35%", scrub: 0.8 },
        });

        tl.to(line, { strokeDashoffset: 0, duration: 1 }, 0)
          .to(
            clip,
            {
              duration: 1,
              motionPath: { path: line, align: line, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
            },
            0
          )
          // Round caps come back once the line is whole.
          .set(line, { strokeLinecap: "round" }, 1);
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <svg ref={ref} viewBox="0 0 600 60" width="100%" aria-hidden="true" style={{ display: "block", maxWidth: 640, marginInline: "auto", overflow: "visible" }}>
      <circle cx="14" cy="30" r="10" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
      <path className="leash-line" d={PATH} fill="none" stroke="var(--leash-stroke)" strokeWidth="3" strokeLinecap="round" />
      {/* Drawn at the origin; GSAP moves it along the path. Without JS it sits at the end. */}
      <g className="leash-clip" transform="translate(576 30)">
        <rect x="-9" y="-9" width="18" height="18" rx="4.5" fill="var(--leash-stroke)" />
        <circle r="3" fill="var(--bg)" />
      </g>
    </svg>
  );
}
