import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCatalogProducts } from "@/lib/db";
import { loadMandate } from "@/lib/spending";
import Shop, { type Product } from "./Shop";

export const metadata: Metadata = {
  title: "Shop",
  description: "Ask the LeashPay agent to find products and build a cart inside your spending rules.",
};

async function ShopData() {
  await connection();
  const mandate = loadMandate();
  const products = getCatalogProducts() as Product[];

  return (
    <Shop
      products={products}
      mandate={
        mandate
          ? {
              budget: mandate.budget,
              allowedCategories: mandate.allowedCategories,
              maxQuantity: mandate.maxQuantity,
            }
          : null
      }
    />
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ minHeight: "80svh" }} />}>
      <ShopData />
    </Suspense>
  );
}
