"use client";

import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { useTheme } from "@/lib/useTheme";

/** The one card style: a React Bits SpotlightCard on the theme's card colour, a soft light following the pointer. */
export default function GlowCard({
  children,
  tone = "brand",
  className = "",
  style,
}: {
  children: React.ReactNode;
  tone?: "brand" | "red";
  className?: string;
  style?: React.CSSProperties;
}) {
  const { theme } = useTheme();
  const light = tone === "red" ? theme.page.block : theme.brand;

  return (
    <SpotlightCard
      key={theme.id}
      theme={theme.scheme}
      spotlightColor={withAlpha(light, theme.scheme === "dark" ? 0.22 : 0.14)}
      className={`rounded-[14px]! p-7! ${className}`}
      style={
        {
          "--spotlight-card-surface": "var(--white)",
          "--spotlight-card-border": "var(--line)",
          "--spotlight-card-shadow": "0 1px 2px rgba(0, 0, 0, 0.05), 0 24px 48px -32px rgba(0, 0, 0, 0.35)",
          ...style,
        } as React.CSSProperties
      }
    >
      {children}
    </SpotlightCard>
  );
}

function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
