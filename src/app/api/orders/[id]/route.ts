import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder, type Order, type OrderStatus } from "@/data/orders";
import { sendOrderConfirmationEmail } from "@/lib/email";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

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

    const updates: Partial<Order> = {};
    if (typeof body.status === "string" && VALID_STATUSES.includes(body.status)) {
      updates.status = body.status as OrderStatus;
    }

    const current = await getOrderById(id);
    if (!current) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404, headers: NO_STORE }
      );
    }

    // Si se pasa a "paid" y no había paidAt, lo sellamos.
    if (updates.status === "paid" && !current.paidAt) {
      updates.paidAt = new Date().toISOString();
    }

    let updated = await updateOrder(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Si la transición es a "paid" y aún no se ha enviado el correo, dispararlo.
    let emailJustSent = false;
    if (
      updates.status === "paid" &&
      current.status !== "paid" &&
      !updated.confirmationEmailSentAt
    ) {
      const sent = await sendOrderConfirmationEmail(updated);
      if (sent) {
        const stamped = await updateOrder(id, {
          confirmationEmailSentAt: new Date().toISOString(),
        });
        if (stamped) updated = stamped;
        emailJustSent = true;
      }
    }

    return NextResponse.json(
      { success: true, order: updated, emailJustSent },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("[orders PUT]", err);
    return NextResponse.json(
      { error: "Error al actualizar pedido" },
      { status: 500 }
    );
  }
}
