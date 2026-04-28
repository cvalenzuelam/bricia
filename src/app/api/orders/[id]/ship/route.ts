import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder, type Order } from "@/data/orders";
import { sendShippingNotificationEmail } from "@/lib/email";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

/**
 * POST /api/orders/[id]/ship
 *
 * Body: {
 *   trackingNumber: string,   // requerido
 *   trackingUrl: string,      // requerido
 *   sendEmail?: boolean,      // default: true
 *   markAsShipped?: boolean,  // default: true
 * }
 *
 * Guarda los datos de rastreo en la orden, marca el status como `shipped`,
 * y dispara el correo de envío al cliente. La idempotencia se controla con
 * `shippingEmailSentAt`: si ya se envió, no se reenvía a menos que se use
 * el endpoint de resend.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const trackingNumber =
      typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "";
    const trackingUrl =
      typeof body.trackingUrl === "string" ? body.trackingUrl.trim() : "";
    const shouldSendEmail = body.sendEmail !== false;
    const shouldMarkShipped = body.markAsShipped !== false;

    if (!trackingNumber) {
      return NextResponse.json(
        { error: "Falta el número de guía." },
        { status: 400, headers: NO_STORE }
      );
    }
    if (!trackingUrl) {
      return NextResponse.json(
        { error: "Falta la URL de rastreo." },
        { status: 400, headers: NO_STORE }
      );
    }
    if (!/^https?:\/\//i.test(trackingUrl)) {
      return NextResponse.json(
        {
          error:
            "La URL de rastreo debe empezar con http:// o https:// (ej. https://www.estafeta.com/...).",
        },
        { status: 400, headers: NO_STORE }
      );
    }

    const current = await getOrderById(id);
    if (!current) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404, headers: NO_STORE }
      );
    }

    const updates: Partial<Order> = {
      trackingNumber,
      trackingUrl,
    };
    if (shouldMarkShipped) {
      updates.status = "shipped";
      if (!current.shippedAt) {
        updates.shippedAt = new Date().toISOString();
      }
    }

    let updated = await updateOrder(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404, headers: NO_STORE }
      );
    }

    let emailJustSent = false;
    let emailError: string | undefined;
    if (shouldSendEmail && !updated.shippingEmailSentAt) {
      const result = await sendShippingNotificationEmail(updated);
      if (result.ok) {
        const stamped = await updateOrder(id, {
          shippingEmailSentAt: new Date().toISOString(),
        });
        if (stamped) updated = stamped;
        emailJustSent = true;
      } else {
        emailError = result.error;
      }
    }

    return NextResponse.json(
      { success: true, order: updated, emailJustSent, emailError },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("[orders ship]", err);
    return NextResponse.json(
      { error: "Error al guardar datos de envío." },
      { status: 500, headers: NO_STORE }
    );
  }
}
