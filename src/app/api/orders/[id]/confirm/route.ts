import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/data/orders";
import { sendOrderConfirmationEmail } from "@/lib/email";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

/**
 * POST /api/orders/[id]/confirm
 * Body: { paymentId?: string, paymentStatus?: string }
 * Marks the order as paid (idempotent) and sends confirmation email once.
 */
export async function POST(
  request: NextRequest,
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

    const body = await request.json().catch(() => ({}));

    let working = order;
    if (
      order.status !== "paid" &&
      order.status !== "shipped" &&
      order.status !== "delivered"
    ) {
      const updated = await updateOrder(id, {
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentId: body.paymentId,
        paymentStatus: body.paymentStatus,
      });
      if (updated) working = updated;
    }

    // Enviar correo una sola vez (idempotente entre webhook + landing de éxito)
    let emailSent = Boolean(working.confirmationEmailSentAt);
    if (!emailSent) {
      const sent = await sendOrderConfirmationEmail(working);
      if (sent) {
        const stamped = await updateOrder(id, {
          confirmationEmailSentAt: new Date().toISOString(),
        });
        if (stamped) working = stamped;
        emailSent = true;
      }
    }

    return NextResponse.json(
      {
        success: true,
        order: working,
        alreadyConfirmed: order.status === "paid",
        emailSent,
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("[orders confirm]", err);
    return NextResponse.json(
      { error: "Error al confirmar pedido" },
      { status: 500 }
    );
  }
}
