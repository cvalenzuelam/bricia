import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/data/orders";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404, headers: NO_STORE }
      );
    }
    return NextResponse.json(order, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { error: "Error al cargar pedido" },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const allowed = ["status"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    const updated = await updateOrder(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, order: updated }, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar pedido" },
      { status: 500 }
    );
  }
}
