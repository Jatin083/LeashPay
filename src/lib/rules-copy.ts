/**
 * Plain-language descriptions of the checks in policy.ts.
 * Each `reason` is the exact string evaluatePolicy returns when that check fails.
 */
export const POLICY_RULES = [
  {
    name: "Budget",
    text: "The cart total, priced from the database, must stay at or under your budget.",
    reason: "Blocked: over budget",
  },
  {
    name: "Categories",
    text: "Every item must come from a category you allowed.",
    reason: "Category not allowed",
  },
  {
    name: "Quantity",
    text: "The total number of items can't pass your limit.",
    reason: "Quantity limit exceeded",
  },
  {
    name: "Stock",
    text: "The shop must have enough of each item in stock.",
    reason: "Insufficient stock",
  },
  {
    name: "Real products only",
    text: "Product ids the catalog doesn't know are rejected.",
    reason: "Unknown product",
  },
  {
    name: "No duplicate lines",
    text: "The same product can't appear twice to slip past the quantity check.",
    reason: "Duplicate product",
  },
  {
    name: "One currency",
    text: "Every price must be in the mandate's currency, US dollars.",
    reason: "Currency mismatch",
  },
  {
    name: "Human approval",
    text: "A mandate that turns off payment approval is treated as invalid.",
    reason: "Invalid mandate",
  },
] as const;
