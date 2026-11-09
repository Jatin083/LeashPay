"use client";

import Link from "next/link";
import StarBorder from "@/components/reactbits/StarBorder";
import { useTheme } from "@/lib/useTheme";

/** A link styled as a React Bits StarBorder button: a light runs around its edge, in the theme's colours. */
export default function StarLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  const { color, trail, surface, text } = theme.star;
  return (
    <StarBorder key={theme.id} as={Link} href={href} color={color} trailColor={trail} radius={8} backgroundColor={surface} textColor={text}>
      {children}
    </StarBorder>
  );
}
