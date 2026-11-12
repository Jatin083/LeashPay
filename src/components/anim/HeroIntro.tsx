import { Fragment } from "react";

/**
 * The hero's one entrance, played once on load, in pure CSS (globals.css, "Hero entrance"):
 * headline words rise out of their line boxes, then the rest settles in, then the
 * product window lifts into place. It starts on first paint, without waiting for any
 * JavaScript, so the hero is never blank while scripts load.
 *   data-hero="pill" | "lede" | "actions" | "window"
 * Headline words come from <SplitWords>.
 */
export default function HeroIntro({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`hero-intro${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}

/** Splits a headline into words that can rise out of their own line box, one after another. */
export function SplitWords({ text, accentFrom }: { text: string; accentFrom?: number }) {
  return (
    <>
      {text.split(" ").map((word, i, words) => (
        // The space sits outside the inline-block, or the browser collapses it.
        <Fragment key={i}>
          <span className="word">
            <span
              className={`word-inner${accentFrom !== undefined && i >= accentFrom ? " accent-word" : ""}`}
              style={{ ["--i" as string]: i }}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
