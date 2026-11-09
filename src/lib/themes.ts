/**
 * LeashPay themes. One source of truth: each theme's colours are written out as CSS
 * custom properties (see themeCss) and read in JS by the canvas components
 * (ClickSpark, StarBorder, ShinyText) through useTheme().
 *
 * Every theme keeps the same 60/30/10 split:
 *   page   the 60%: the ground most of the site sits on
 *   deep   the 30%: hero, nav, the rules and closing panels
 *   hot    the 10%: buttons, the leash, active states
 * plus two signal colours, pass and block, and a light "frame" for the product window.
 */

export type Theme = {
  id: string;
  name: string;
  note: string;
  themeColor: string;
  scheme: "light" | "dark";
  page: Tokens;
  deep: Tokens;
  frame: Tokens;
  hot: string;
  hotHover: string;
  hotGrad: string;
  hotInk: string;
  hotGlow: string;
  brand: string;
  brandInk: string;
  mesh: [string, string, string];
  meshMid: string;
  navBg: string;
  frameShadow: string;
  gradientText: string[];
  sparks: string[];
  shine: { base: string; light: string };
  star: { color: string; trail: string; surface: string; text: string };
};

type Tokens = {
  bg: string;
  surface: string;
  card: string;
  ink: string;
  muted: string;
  line: string;
  pass: string;
  passSoft: string;
  block: string;
  blockSoft: string;
  leash: string;
};

const lightFrame = (ink: string, muted: string, line: string, pass: string, block: string): Tokens => ({
  bg: "#f6f7fb",
  surface: "#eef0f6",
  card: "#ffffff",
  ink,
  muted,
  line,
  pass,
  passSoft: hexA(pass, 0.1),
  block,
  blockSoft: hexA(block, 0.09),
  leash: pass,
});

export const THEMES: Theme[] = [
  {
    id: "klein",
    name: "Klein",
    note: "Klein blue, white, electric lime",
    themeColor: "#1b2bf5",
    scheme: "light",
    page: {
      bg: "#ffffff",
      surface: "#eef0f8",
      card: "#ffffff",
      ink: "#0b0d1f",
      muted: "#5b5f7a",
      line: "rgba(11, 13, 31, 0.1)",
      pass: "#0f8a5f",
      passSoft: "rgba(15, 138, 95, 0.1)",
      block: "#e0323c",
      blockSoft: "rgba(224, 50, 60, 0.09)",
      leash: "#1b2bf5",
    },
    deep: {
      bg: "#1b2bf5",
      surface: "#3a48ff",
      card: "#1424d6",
      ink: "#ffffff",
      muted: "#cfd3ff",
      line: "rgba(255, 255, 255, 0.2)",
      pass: "#b9f8d6",
      passSoft: "rgba(185, 248, 214, 0.16)",
      block: "#ffc6cb",
      blockSoft: "rgba(255, 198, 203, 0.18)",
      leash: "#c8f53a",
    },
    frame: lightFrame("#0b0d1f", "#5b5f7a", "rgba(11, 13, 31, 0.1)", "#0f8a5f", "#e0323c"),
    hot: "#c8f53a",
    hotHover: "#d8ff5c",
    hotGrad: "linear-gradient(135deg, #dcff70 0%, #c8f53a 60%, #b2e622 100%)",
    hotInk: "#0b0d1f",
    hotGlow: "rgba(200, 245, 58, 0.7)",
    brand: "#1b2bf5",
    brandInk: "#ffffff",
    mesh: ["rgba(96, 112, 255, 0.95)", "rgba(8, 18, 170, 0.8)", "rgba(200, 245, 58, 0.38)"],
    meshMid: "#8f97ff",
    navBg: "rgba(27, 43, 245, 0.9)",
    frameShadow: "rgba(8, 12, 90, 0.5)",
    gradientText: ["#dcff70", "#c8f53a", "#ffffff", "#dcff70"],
    sparks: ["#c8f53a", "#1b2bf5", "#0b0d1f"],
    shine: { base: "#cfd3ff", light: "#ffffff" },
    star: { color: "#c8f53a", trail: "#ffffff", surface: "#1424d6", text: "#ffffff" },
  },
  {
    id: "cobalt",
    name: "Cobalt",
    note: "Cobalt ink, paper, marigold",
    themeColor: "#0b1a4a",
    scheme: "light",
    page: {
      bg: "#f5f6f9",
      surface: "#eaeef6",
      card: "#ffffff",
      ink: "#0b1a4a",
      muted: "#5a6485",
      line: "rgba(11, 26, 74, 0.1)",
      pass: "#11845b",
      passSoft: "rgba(17, 132, 91, 0.1)",
      block: "#d9363e",
      blockSoft: "rgba(217, 54, 62, 0.09)",
      leash: "#2147e6",
    },
    deep: {
      bg: "#0b1a4a",
      surface: "#1c2f73",
      card: "#13256a",
      ink: "#f5f6f9",
      muted: "#a9b4d6",
      line: "rgba(245, 246, 249, 0.12)",
      pass: "#5be3a4",
      passSoft: "rgba(91, 227, 164, 0.14)",
      block: "#ff7a70",
      blockSoft: "rgba(255, 122, 112, 0.15)",
      leash: "#ffb224",
    },
    frame: lightFrame("#0b1a4a", "#5a6485", "rgba(11, 26, 74, 0.1)", "#11845b", "#d9363e"),
    hot: "#ffb224",
    hotHover: "#ffc24d",
    hotGrad: "linear-gradient(135deg, #ffd166 0%, #ffb224 55%, #ff9a3c 100%)",
    hotInk: "#1f1500",
    hotGlow: "rgba(255, 154, 60, 0.75)",
    brand: "#2147e6",
    brandInk: "#ffffff",
    mesh: ["rgba(33, 71, 230, 0.85)", "rgba(76, 110, 255, 0.55)", "rgba(255, 178, 36, 0.32)"],
    meshMid: "#3a4f9a",
    navBg: "rgba(11, 26, 74, 0.84)",
    frameShadow: "rgba(11, 26, 74, 0.55)",
    gradientText: ["#ffd166", "#ffb224", "#ff9a3c", "#ffd166"],
    sparks: ["#ffb224", "#2147e6", "#ff9a3c"],
    shine: { base: "#a9b4d6", light: "#ffffff" },
    star: { color: "#ffb224", trail: "#ff9a3c", surface: "#13256a", text: "#ffffff" },
  },
  {
    id: "midnight",
    name: "Midnight",
    note: "Black, slate, mint-to-blue",
    themeColor: "#070a12",
    scheme: "dark",
    page: {
      bg: "#070a12",
      surface: "#1a2338",
      card: "#0e1422",
      ink: "#e9eef8",
      muted: "#8b97ad",
      line: "rgba(233, 238, 248, 0.09)",
      pass: "#4ade9c",
      passSoft: "rgba(74, 222, 156, 0.12)",
      block: "#ff6b5a",
      blockSoft: "rgba(255, 107, 90, 0.13)",
      leash: "#6ef2c9",
    },
    deep: {
      bg: "#0e1422",
      surface: "#1a2338",
      card: "#141c2e",
      ink: "#e9eef8",
      muted: "#8b97ad",
      line: "rgba(233, 238, 248, 0.1)",
      pass: "#4ade9c",
      passSoft: "rgba(74, 222, 156, 0.12)",
      block: "#ff6b5a",
      blockSoft: "rgba(255, 107, 90, 0.13)",
      leash: "#6ef2c9",
    },
    frame: {
      bg: "#070a12",
      surface: "#1a2338",
      card: "#0e1422",
      ink: "#e9eef8",
      muted: "#8b97ad",
      line: "rgba(233, 238, 248, 0.1)",
      pass: "#4ade9c",
      passSoft: "rgba(74, 222, 156, 0.12)",
      block: "#ff6b5a",
      blockSoft: "rgba(255, 107, 90, 0.13)",
      leash: "#6ef2c9",
    },
    hot: "#6ef2c9",
    hotHover: "#8ff7d8",
    hotGrad: "linear-gradient(120deg, #6ef2c9 0%, #56c6e8 45%, #4c8dff 100%)",
    hotInk: "#04101f",
    hotGlow: "rgba(76, 141, 255, 0.75)",
    brand: "#4c8dff",
    brandInk: "#ffffff",
    mesh: ["rgba(76, 141, 255, 0.5)", "rgba(110, 242, 201, 0.25)", "rgba(76, 141, 255, 0.35)"],
    meshMid: "#0a0e18",
    navBg: "rgba(7, 10, 18, 0.75)",
    frameShadow: "rgba(76, 141, 255, 0.35)",
    gradientText: ["#6ef2c9", "#56c6e8", "#4c8dff", "#6ef2c9"],
    sparks: ["#6ef2c9", "#56c6e8", "#4c8dff"],
    shine: { base: "#8b97ad", light: "#e9eef8" },
    star: { color: "#6ef2c9", trail: "#4c8dff", surface: "#0e1422", text: "#e9eef8" },
  },
  {
    id: "pine",
    name: "Pine",
    note: "Pine, bone, hi-vis lime",
    themeColor: "#0f241b",
    scheme: "light",
    page: {
      bg: "#efe8da",
      surface: "#e6decd",
      card: "#f7f3ea",
      ink: "#0f241b",
      muted: "#5d6b62",
      line: "rgba(15, 36, 27, 0.12)",
      pass: "#1f6b3a",
      passSoft: "rgba(31, 107, 58, 0.1)",
      block: "#c4321f",
      blockSoft: "rgba(196, 50, 31, 0.09)",
      leash: "#0f241b",
    },
    deep: {
      bg: "#0f241b",
      surface: "#21473a",
      card: "#163428",
      ink: "#efe8da",
      muted: "#a6b3a9",
      line: "rgba(239, 232, 218, 0.12)",
      pass: "#8fe3a8",
      passSoft: "rgba(143, 227, 168, 0.14)",
      block: "#ff7a62",
      blockSoft: "rgba(255, 122, 98, 0.14)",
      leash: "#d6f34a",
    },
    frame: {
      bg: "#efe8da",
      surface: "#ece5d6",
      card: "#fbf9f4",
      ink: "#0f241b",
      muted: "#5d6b62",
      line: "rgba(15, 36, 27, 0.12)",
      pass: "#1f6b3a",
      passSoft: "rgba(31, 107, 58, 0.1)",
      block: "#c4321f",
      blockSoft: "rgba(196, 50, 31, 0.09)",
      leash: "#1f6b3a",
    },
    hot: "#d6f34a",
    hotHover: "#e2fa72",
    hotGrad: "linear-gradient(135deg, #e2fa72 0%, #d6f34a 100%)",
    hotInk: "#0f241b",
    hotGlow: "rgba(214, 243, 74, 0.8)",
    brand: "#0f241b",
    brandInk: "#efe8da",
    mesh: ["rgba(31, 107, 58, 0.6)", "rgba(33, 71, 58, 0.6)", "rgba(214, 243, 74, 0.3)"],
    meshMid: "#6e7a63",
    navBg: "rgba(15, 36, 27, 0.86)",
    frameShadow: "rgba(0, 0, 0, 0.5)",
    gradientText: ["#e2fa72", "#d6f34a", "#efe8da", "#e2fa72"],
    sparks: ["#d6f34a", "#1f6b3a", "#0f241b"],
    shine: { base: "#a6b3a9", light: "#efe8da" },
    star: { color: "#d6f34a", trail: "#efe8da", surface: "#163428", text: "#efe8da" },
  },
  {
    id: "paper",
    name: "Paper",
    note: "Minimal off-white, ink, deep green",
    themeColor: "#f8f8f8",
    scheme: "light",
    page: {
      bg: "#f8f8f8",
      surface: "#eeeeee",
      card: "#ffffff",
      ink: "#0a0a0a",
      muted: "#6a6a6a",
      line: "rgba(10, 10, 10, 0.1)",
      pass: "#1f6b3a",
      passSoft: "rgba(31, 107, 58, 0.09)",
      block: "#c4321f",
      blockSoft: "rgba(196, 50, 31, 0.08)",
      leash: "#1f6b3a",
    },
    deep: {
      bg: "#efefef",
      surface: "#e4e4e4",
      card: "#ffffff",
      ink: "#0a0a0a",
      muted: "#6a6a6a",
      line: "rgba(10, 10, 10, 0.1)",
      pass: "#1f6b3a",
      passSoft: "rgba(31, 107, 58, 0.09)",
      block: "#c4321f",
      blockSoft: "rgba(196, 50, 31, 0.08)",
      leash: "#1f6b3a",
    },
    frame: lightFrame("#0a0a0a", "#6a6a6a", "rgba(10, 10, 10, 0.1)", "#1f6b3a", "#c4321f"),
    hot: "#0a0a0a",
    hotHover: "#262626",
    hotGrad: "linear-gradient(#0a0a0a, #0a0a0a)",
    hotInk: "#ffffff",
    hotGlow: "rgba(10, 10, 10, 0.35)",
    brand: "#0a0a0a",
    brandInk: "#ffffff",
    mesh: ["rgba(31, 107, 58, 0.14)", "rgba(10, 10, 10, 0.05)", "rgba(31, 107, 58, 0.1)"],
    meshMid: "#f3f3f3",
    navBg: "rgba(248, 248, 248, 0.8)",
    frameShadow: "rgba(10, 10, 10, 0.18)",
    gradientText: ["#0a0a0a", "#1f6b3a", "#0a0a0a"],
    sparks: ["#1f6b3a", "#0a0a0a"],
    shine: { base: "#6a6a6a", light: "#0a0a0a" },
    star: { color: "#1f6b3a", trail: "#0a0a0a", surface: "#ffffff", text: "#0a0a0a" },
  },
];

export const DEFAULT_THEME = THEMES[0];
export const THEME_STORAGE_KEY = "leashpay-theme";

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

function hexA(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function tokenVars(prefix: string, t: Tokens) {
  return [
    `--${prefix}-bg: ${t.bg};`,
    `--${prefix}-surface: ${t.surface};`,
    `--${prefix}-card: ${t.card};`,
    `--${prefix}-ink: ${t.ink};`,
    `--${prefix}-muted: ${t.muted};`,
    `--${prefix}-line: ${t.line};`,
    `--${prefix}-pass: ${t.pass};`,
    `--${prefix}-pass-soft: ${t.passSoft};`,
    `--${prefix}-block: ${t.block};`,
    `--${prefix}-block-soft: ${t.blockSoft};`,
    `--${prefix}-leash: ${t.leash};`,
  ];
}

function themeVars(t: Theme) {
  return [
    `color-scheme: ${t.scheme};`,
    ...tokenVars("tp", t.page),
    ...tokenVars("td", t.deep),
    ...tokenVars("tf", t.frame),
    `--t-hot: ${t.hot};`,
    `--t-hot-hover: ${t.hotHover};`,
    `--t-hot-grad: ${t.hotGrad};`,
    `--t-hot-ink: ${t.hotInk};`,
    `--t-hot-glow: ${t.hotGlow};`,
    `--t-brand: ${t.brand};`,
    `--t-brand-ink: ${t.brandInk};`,
    `--t-mesh-1: ${t.mesh[0]};`,
    `--t-mesh-2: ${t.mesh[1]};`,
    `--t-mesh-3: ${t.mesh[2]};`,
    `--t-mesh-mid: ${t.meshMid};`,
    `--t-nav-bg: ${t.navBg};`,
    `--t-frame-shadow: ${t.frameShadow};`,
  ].join(" ");
}

/** Static CSS for every theme. The default theme also sits on :root so the page works before JS. */
export function themeCss() {
  return THEMES.map(
    (t) => `${t.id === DEFAULT_THEME.id ? ":root, " : ""}html[data-theme="${t.id}"] { ${themeVars(t)} }`
  ).join("\n");
}

/**
 * Runs in <head> before paint, so a saved theme never flashes the default first.
 * A ?theme=<id> link wins over the saved choice for that visit (handy for sharing a theme).
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var ids=${JSON.stringify(
  THEMES.map((t) => t.id)
)};var colors=${JSON.stringify(Object.fromEntries(THEMES.map((t) => [t.id, t.themeColor])))};var q=new URLSearchParams(location.search).get("theme");var id=ids.indexOf(q)>=0?q:localStorage.getItem("${THEME_STORAGE_KEY}");if(ids.indexOf(id)<0)return;document.documentElement.setAttribute("data-theme",id);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",colors[id]);}catch(e){}})();`;
