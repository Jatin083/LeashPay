
import { describe, expect, it } from "vitest";
import {
  evaluatePolicy,
  type CatalogProduct,
} from "./policy";

const catalog: CatalogProduct[] = [
  {
    id: "headphones-1",
    name: "Gym Headphones",
    category: "Electronics",
    price: 249900,
    currency: "USD",
    stock: 5,
  },
  {
    id: "headphones-2",
    name: "Premium Headphones",
    category: "Electronics",
    price: 4000000,
    currency: "USD",
    stock: 3,
  },
  {
    id: "shoes-1",
    name: "Running Shoes",
    category: "Fashion",
    price: 199900,
    currency: "USD",
    stock: 5,
  },
];

const mandate = {
  budget: 400000,
  currency: "USD",
  allowedCategories: ["Electronics"],
  maxQuantity: 2,
  requireApproval: true,
};

describe("LeashPay spending policy", () => {
  it("allows a valid purchase", () => {
    expect(
      evaluatePolicy(
        mandate,
        { items: [{ productId: "headphones-1", quantity: 1 }] },
        catalog
      )
    ).toEqual({ allowed: true, total: 249900 });
  });

  it("blocks purchases over budget", () => {
    const result = evaluatePolicy(
      mandate,
      { items: [{ productId: "headphones-2", quantity: 1 }] },
      catalog
    );
    expect(result).toEqual({
      allowed: false,
      reason: "Blocked: over budget",
    });
  });

  it("blocks disallowed categories", () => {
    const result = evaluatePolicy(
      mandate,
      { items: [{ productId: "shoes-1", quantity: 1 }] },
      catalog
    );
    expect(result).toMatchObject({
      allowed: false,
      reason: "Category not allowed",
    });
  });

  it("blocks excessive quantities", () => {
    const result = evaluatePolicy(
      mandate,
      { items: [{ productId: "headphones-1", quantity: 3 }] },
      catalog
    );
    expect(result).toMatchObject({
      allowed: false,
      reason: "Quantity limit exceeded",
    });
  });

  it("blocks unknown products", () => {
    const result = evaluatePolicy(
      mandate,
      { items: [{ productId: "fake-product", quantity: 1 }] },
      catalog
    );
    expect(result).toMatchObject({
      allowed: false,
      reason: "Unknown product",
    });
  });

  it("blocks attempts to disable approval", () => {
    const result = evaluatePolicy(
      { ...mandate, requireApproval: false },
      { items: [{ productId: "headphones-1", quantity: 1 }] },
      catalog
    );
    expect(result.allowed).toBe(false);
  });

  it("blocks duplicate products", () => {
    const result = evaluatePolicy(
      mandate,
      {
        items: [
          { productId: "headphones-1", quantity: 1 },
          { productId: "headphones-1", quantity: 1 },
        ],
      },
      catalog
    );
    expect(result).toMatchObject({
      allowed: false,
      reason: "Duplicate product",
    });
  });
});
