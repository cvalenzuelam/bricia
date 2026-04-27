import { NextRequest, NextResponse } from "next/server";
import { getProducts, updateProduct, deleteProduct } from "@/data/products-server";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const products = await getProducts();
    const product = products.find((p) => p.id === id);
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json(product, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Error al cargar producto" }, { status: 500, headers: NO_STORE });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateProduct(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
