import type { Metadata, Viewport } from "next";
import { Host_Grotesk, JetBrains_Mono } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollRail from "@/components/ScrollRail";
import { DEFAULT_THEME, THEME_BOOT_SCRIPT, themeCss } from "@/lib/themes";
import "lenis/dist/lenis.css";
import "./globals.css";

const text = Host_Grotesk({
  variable: "--font-text",
  subsets: ["latin"],
});

const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "LeashPay: an AI shopping agent that can't overspend",
    template: "%s · LeashPay",
  },
  description:
    "LeashPay lets an AI shopping agent search, compare and build your cart. Your budget is enforced in code, and every payment needs your approval on PayPal.",
  openGraph: {
    title: "LeashPay",
    description: "An AI shopping agent that can't spend past your rules.",
    type: "website",
  },
  other: {
    "page-type": "software",
    "site-kind": "software",
  },
};

export const viewport: Viewport = {
  themeColor: DEFAULT_THEME.themeColor,
};

// Built from the theme registry at build time; no user input reaches either string.
const THEME_CSS = themeCss();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-type="software"
      data-radius="sharp"
      data-theme={DEFAULT_THEME.id}
      className={`${text.variable} ${code.variable}`}
      // The boot script may switch data-theme before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <SmoothScroll>
          <SiteNav />
          <main id="main">{children}</main>
          <SiteFooter />
          <ScrollRail />
        </SmoothScroll>
      </body>
    </html>
  );
}
