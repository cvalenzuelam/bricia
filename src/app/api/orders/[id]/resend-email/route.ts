import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/data/orders";
import { sendOrderConfirmationEmail } from "@/lib/email";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

/**
 * POST /api/orders/[id]/resend-email
 * Reenvía el correo de confirmación al cliente, sin importar si ya se envió antes.
 * Pensado para uso del admin cuando el webhook de MP no llegó o el cliente lo perdió.
 */
export async function POST(
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

    const sent = await sendOrderConfirmationEmail(order);
    if (!sent) {
      return NextResponse.json(
        {
          error:
            "No se pudo enviar el correo. Revisa RESEND_API_KEY/EMAIL_FROM en el servidor.",
        },
        { status: 500, headers: NO_STORE }
      );
    }

    const stamped = await updateOrder(id, {
      confirmationEmailSentAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, order: stamped ?? order },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("[orders resend-email]", err);
    return NextResponse.json(
      { error: "Error al reenviar correo" },
      { status: 500, headers: NO_STORE }
    );
  }
}
