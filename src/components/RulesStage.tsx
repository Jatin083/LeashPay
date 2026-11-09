"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "motion/react";
import { POLICY_RULES } from "@/lib/rules-copy";
import { ThemedGradientText } from "@/components/Themed";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, useGSAP);

const COUNT = POLICY_RULES.length;
const LEASH = "M 20 30 C 220 62, 420 0, 620 32 S 900 40, 980 30";
const SWAP = { type: "spring", bounce: 0, duration: 0.5 } as const;

/**
 * The eight rules as one card, styled like the closing "Shop on a leash" panel.
 * The card pins under the nav while you scroll; each stretch of scroll swaps in the
 * next rule, and the leash along the bottom draws with you, its clip riding the tip.
 * Screen readers get the full list instead of the swapping card.
 */
export default function RulesStage() {
  const section = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const svg = section.current?.querySelector<SVGSVGElement>(".stage-leash");
      const line = svg?.querySelector<SVGPathElement>(".leash-line");
      const clip = svg?.querySelector<SVGGElement>(".leash-clip");
      if (!line || !clip) return;

      const length = line.getTotalLength();
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section.current,
          pin: pin.current,
          start: "top top+=88",
          // One long stretch of scroll per rule.
          end: () => `+=${window.innerHeight * 0.55 * COUNT}`,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setActive(Math.min(COUNT - 1, Math.floor(self.progress * COUNT))),
        },
      });
      tl.to(line, { strokeDashoffset: 0, duration: 1 }, 0).to(
        clip,
        { duration: 1, motionPath: { path: line, align: line, alignOrigin: [0.5, 0.5], start: 0, end: 1 } },
        0
      );
    },
    { scope: section }
  );

  const rule = POLICY_RULES[active];

  return (
    <div ref={section}>
      {/* Screen readers: the whole list, read in order. */}
      <ol className="sr-only">
        {POLICY_RULES.map((r) => (
          <li key={r.name}>
            {r.name}: {r.text} Blocked with: {r.reason}.
          </li>
        ))}
      </ol>

      <div ref={pin} className="wrap">
        <div className="panel dark rules-card" aria-hidden="true">
          <div className="rules-top">
            <h2 id="rules-h" className="h3" style={{ margin: 0 }}>
              Eight rules checked in code
            </h2>
            <p className="num rules-count">
              <span className="rules-count-window">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={active}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-100%" }}
                    transition={SWAP}
                    style={{ position: "absolute", inset: 0, color: "var(--t-hot)" }}
                  >
                    {String(active + 1).padStart(2, "0")}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="muted"> / {String(COUNT).padStart(2, "0")}</span>
            </p>
          </div>

          <div className="rules-body">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={rule.name}
                initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="rules-name">
                  <ThemedGradientText>{rule.name}</ThemedGradientText>
                </p>
                <p className="lede" style={{ margin: "18px auto 0" }}>
                  {rule.text}
                </p>
                <p className="small muted" style={{ margin: "28px 0 8px" }}>
                  When it fails, the shop shows
                </p>
                <span className="chip chip-block">{rule.reason}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="rules-foot">
            <svg className="stage-leash" viewBox="0 0 1000 60" width="100%" style={{ display: "block", overflow: "visible" }}>
              <circle cx="12" cy="30" r="9" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
              <path d={LEASH} fill="none" stroke="var(--line)" strokeWidth="2.5" strokeLinecap="round" />
              <path className="leash-line" d={LEASH} fill="none" stroke="var(--t-hot)" strokeWidth="3" strokeLinecap="butt" />
              <g className="leash-clip" transform="translate(980 30)">
                <rect x="-9" y="-9" width="18" height="18" rx="4.5" fill="var(--t-hot)" />
                <circle r="3" fill="var(--td-bg)" />
              </g>
            </svg>
            <div className="rules-ticks">
              {POLICY_RULES.map((r, i) => (
                <span key={r.name} className={i <= active ? "is-on" : undefined} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center" style={{ marginTop: 20 }}>
          <Link href="/rules" className="btn btn-quiet">
            See your rules
          </Link>
        </div>
      </div>
    </div>
  );
}
