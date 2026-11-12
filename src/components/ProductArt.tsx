import { Footprints, Headphones, Monitor, ShoppingBag } from "lucide-react";

/*
  A product picture for the demo catalog. The shop has no product photos (and real brand
  photos would need a licence), so each product gets an illustration tile in the theme's
  colours, with an icon for what it is.
*/

const ICONS = { headphones: Headphones, monitor: Monitor, shoes: Footprints, other: ShoppingBag } as const;

function kindOf(name: string, category: string): keyof typeof ICONS {
  const text = `${name} ${category}`.toLowerCase();
  if (/headphone|earbud|audio|wh-|tune|life q/.test(text)) return "headphones";
  if (/monitor|display|screen/.test(text)) return "monitor";
  if (/shoe|sneaker|running|fashion/.test(text)) return "shoes";
  return "other";
}

export default function ProductArt({ name, category, size = "md" }: { name: string; category: string; size?: "sm" | "md" }) {
  const kind = kindOf(name, category);
  const iconSize = size === "sm" ? 26 : 40;
  return (
    <div className={`product-art product-art-${size}`} role="img" aria-label={`${name} illustration`}>
      {kind === "headphones" && <ICONS.headphones size={iconSize} strokeWidth={1.6} aria-hidden="true" />}
      {kind === "monitor" && <ICONS.monitor size={iconSize} strokeWidth={1.6} aria-hidden="true" />}
      {kind === "shoes" && <ICONS.shoes size={iconSize} strokeWidth={1.6} aria-hidden="true" />}
      {kind === "other" && <ICONS.other size={iconSize} strokeWidth={1.6} aria-hidden="true" />}
    </div>
  );
}
