import "server-only";
import { getMandate, getProductsByIds } from "@/lib/db";
import {
  evaluatePolicy,
  type CatalogProduct,
  type Mandate,
  type PolicyResult,
} from "@/lib/policy";

type ProductRow = CatalogProduct & {
  rating: number;
  description: string;
};

/** Loads the server-side spending mandate. Returns null if it is missing or invalid. */
export function loadMandate(): Mandate | null {
  const row = getMandate();
  if (!row) return null;

  let allowedCategories: unknown;
  try {
    allowedCategories = JSON.parse(row.allowed_categories);
  } catch {
    return null;
  }

  if (
    !Array.isArray(allowedCategories) ||
    !allowedCategories.every((c) => typeof c === "string")
  ) {
    return null;
  }

  return {
    budget: row.budget,
    currency: row.currency,
    allowedCategories,
    maxQuantity: row.max_quantity,
    // Typed as literal true; evaluatePolicy rejects anything else.
    requireApproval: (row.require_approval === 1) as true,
  };
}

/** Product ids from an untrusted cart, used only to look up catalog rows. */
function cartProductIds(cart: unknown): string[] {
  if (typeof cart !== "object" || cart === null || !("items" in cart)) {
    return [];
  }
  const items = (cart as { items: unknown }).items;
  if (!Array.isArray(items)) return [];

  return items
    .map((item) =>
      typeof item === "object" && item !== null && "productId" in item
        ? (item as { productId: unknown }).productId
        : undefined
    )
    .filter((id): id is string => typeof id === "string")
    .slice(0, 20);
}

export type CartCheck =
  | { ok: false; status: number; reason: string }
  | { ok: true; result: PolicyResult; products: ProductRow[] };

/**
 * Runs the spending policy on an untrusted cart against the stored mandate
 * and the real catalog. Prices always come from the database, never the client.
 */
export function checkCart(cart: unknown): CartCheck {
  const mandate = loadMandate();
  if (!mandate) {
    return { ok: false, status: 500, reason: "No valid spending mandate configured" };
  }

  const products = getProductsByIds(cartProductIds(cart)) as ProductRow[];
  const result = evaluatePolicy(mandate, cart, products);

  return { ok: true, result, products };
}
