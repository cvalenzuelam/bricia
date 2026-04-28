import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/data/orders";
import {
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
} from "@/lib/email";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

type EmailType = "confirmation" | "shipping";

/**
 * POST /api/orders/[id]/resend-email
 *
 * Body opcional: { type?: "confirmation" | "shipping" }
 * Default: "confirmation"
 *
 * Reenvía el correo correspondiente sin importar si ya se envió antes.
 * Pensado para uso del admin (recuperación manual o pruebas).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const type: EmailType = body?.type === "shipping" ? "shipping" : "confirmation";

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404, headers: NO_STORE }
      );
    }

    if (type === "shipping") {
      if (!order.trackingNumber || !order.trackingUrl) {
        return NextResponse.json(
          {
            error:
              "Faltan datos de rastreo. Captura primero el número de guía y la URL.",
          },
          { status: 400, headers: NO_STORE }
        );
      }
      const result = await sendShippingNotificationEmail(order);
      if (!result.ok) {
        return NextResponse.json(
          {
            error: result.error || "No se pudo enviar el correo.",
            hint:
              "Revisa RESEND_API_KEY y que EMAIL_FROM use un dominio válido en Resend.",
          },
          { status: 500, headers: NO_STORE }
        );
      }
      const stamped = await updateOrder(id, {
        shippingEmailSentAt: new Date().toISOString(),
      });
      return NextResponse.json(
        { success: true, order: stamped ?? order, type },
        { headers: NO_STORE }
      );
    }

    const result = await sendOrderConfirmationEmail(order);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error || "No se pudo enviar el correo.",
          hint:
            "Revisa RESEND_API_KEY y que EMAIL_FROM use un dominio verificado en Resend.",
        },
        { status: 500, headers: NO_STORE }
      );
    }

    const stamped = await updateOrder(id, {
      confirmationEmailSentAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, order: stamped ?? order, type },
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
