
import { z } from "zod";

export const MandateSchema = z.object({
  budget: z.number().int().positive(),
  currency: z.literal("USD"),
  allowedCategories: z.array(z.string().min(1)).min(1),
  maxQuantity: z.number().int().positive().max(10),
  requireApproval: z.literal(true),
});

export const CartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const CartSchema = z.object({
  items: z.array(CartItemSchema).min(1).max(20),
});

export type Mandate = z.infer<typeof MandateSchema>;

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  price: number; // Minor currency units (paise)
  currency: "USD";
  stock: number;
};

export type PolicyResult =
  | { allowed: true; total: number }
  | { allowed: false; reason: string };

export function evaluatePolicy(
  mandateInput: unknown,
  cartInput: unknown,
  catalog: CatalogProduct[]
): PolicyResult {
  const mandateResult = MandateSchema.safeParse(mandateInput);
  if (!mandateResult.success) {
    return { allowed: false, reason: "Invalid mandate" };
  }

  const cartResult = CartSchema.safeParse(cartInput);
  if (!cartResult.success) {
    return { allowed: false, reason: "Invalid cart" };
  }

  const mandate = mandateResult.data;
  const cart = cartResult.data;

  let total = 0;
  let totalQuantity = 0;
  const seen = new Set<string>();

  for (const item of cart.items) {
    if (seen.has(item.productId)) {
      return { allowed: false, reason: "Duplicate product" };
    }
    seen.add(item.productId);

    const product = catalog.find((p) => p.id === item.productId);

    if (!product) {
      return { allowed: false, reason: "Unknown product" };
    }

    if (product.currency !== mandate.currency) {
      return { allowed: false, reason: "Currency mismatch" };
    }

    if (!Number.isSafeInteger(product.price) || product.price <= 0) {
      return { allowed: false, reason: "Invalid catalog price" };
    }

    if (!Number.isSafeInteger(product.stock) || product.stock < item.quantity) {
      return { allowed: false, reason: "Insufficient stock" };
    }

    if (!mandate.allowedCategories.includes(product.category)) {
      return { allowed: false, reason: "Category not allowed" };
    }

    totalQuantity += item.quantity;
    if (totalQuantity > mandate.maxQuantity) {
      return { allowed: false, reason: "Quantity limit exceeded" };
    }

    total += product.price * item.quantity;

    if (!Number.isSafeInteger(total)) {
      return { allowed: false, reason: "Invalid total" };
    }

    if (total > mandate.budget) {
      return { allowed: false, reason: "Blocked: over budget" };
    }
  }

  return { allowed: true, total };
}
