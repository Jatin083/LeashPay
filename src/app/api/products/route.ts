
import { connection, NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    const products = getCatalogProducts();

    return NextResponse.json({
      products: (products as Array<Record<string, unknown>>).map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        currency: product.currency,
        stock: product.stock,
        rating: product.rating,
        description: product.description,
      })),
    });
  } catch (error) {
    console.error("Catalog error:", error);

    return NextResponse.json(
      { error: "Unable to load product catalog" },
      { status: 500 }
    );
  }
}
