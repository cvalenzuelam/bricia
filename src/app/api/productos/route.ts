import { NextRequest, NextResponse } from "next/server";
import { getProducts, addProduct, generateProductId } from "@/data/products-server";
import type { Product } from "@/data/products";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

/** Alineado con /api/recipes: menos invocations y mejor acierto CDN en Hobby */
const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products, { headers: PUBLIC_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Error al cargar productos" },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subtitle, price, description, image, category, stock, dimensions, material } =
      body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Nombre y categoría son obligatorios" },
        { status: 400 }
      );
    }

    const dim = typeof dimensions === "string" ? dimensions.trim() : "";
    const mat = typeof material === "string" ? material.trim() : "";

    const id = generateProductId(name);
    const product: Product = {
      id,
      name,
      subtitle: subtitle || "",
      price: Number(price) || 0,
      description: description || "",
      image: image || "/images/mesa_setting.png",
      category: category as Product["category"],
      stock: Number(stock) ?? 0,
      ...(dim ? { dimensions: dim } : {}),
      ...(mat ? { material: mat } : {}),
    };

    await addProduct(product);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}
