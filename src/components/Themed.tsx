"use client";

import GradientText from "@/components/reactbits/GradientText";
import ShinyText from "@/components/reactbits/ShinyText";
import { useTheme } from "@/lib/useTheme";

/*
  React Bits components that paint with canvas need real colour values, not CSS
  variables. These wrappers hand them the active theme's colours and re-render on a switch.
*/

export function ThemedShiny({ text }: { text: string }) {
  const { theme } = useTheme();
  return <ShinyText key={theme.id} text={text} color={theme.shine.base} shineColor={theme.shine.light} speed={3} />;
}

export function ThemedGradientText({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <GradientText key={theme.id} colors={theme.gradientText} animationSpeed={6}>
      {children}
    </GradientText>
  );
}
