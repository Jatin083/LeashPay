/*
  Shine and gradient text, in pure CSS (globals.css, "Text effects"). They read the active
  theme's colours from CSS variables, so a theme switch restyles them with no JavaScript.
  Earlier versions used React Bits ShinyText and GradientText, which redraw on every frame;
  these look the same and let the browser animate them without running scripts.
*/

export function ThemedShiny({ text }: { text: string }) {
  return <span className="shine-text">{text}</span>;
}

export function ThemedGradientText({ children }: { children: React.ReactNode }) {
  return <span className="grad-anim">{children}</span>;
}
