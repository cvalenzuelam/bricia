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

    let paymentId: string | undefined =
      typeof body.paymentId === "string" ? body.paymentId : undefined;
    let paymentStatus: string | undefined =
      typeof body.paymentStatus === "string" ? body.paymentStatus : undefined;

    if (typeof body.stripeSessionId === "string" && body.stripeSessionId) {
      const { getStripe, isStripeConfigured } = await import("@/lib/stripe/server");
      if (!isStripeConfigured()) {
        return NextResponse.json(
          { error: "Stripe no configurado" },
          { status: 503, headers: NO_STORE }
        );
      }
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(body.stripeSessionId);
      const sessionOrder =
        session.metadata?.orderId ?? session.client_reference_id ?? undefined;
      if (sessionOrder !== id) {
        return NextResponse.json(
          { error: "La sesión de pago no corresponde a este pedido" },
          { status: 403, headers: NO_STORE }
        );
      }
      if (session.payment_status !== "paid") {
        return NextResponse.json(
          { error: "El pago con Stripe aún no está completado" },
          { status: 400, headers: NO_STORE }
        );
      }
      const expected = session.metadata?.expectedTotalCents;
      if (
        expected &&
        session.amount_total != null &&
        String(session.amount_total) !== expected
      ) {
        return NextResponse.json(
          { error: "Importe del pago no coincide con el pedido" },
          { status: 400, headers: NO_STORE }
        );
      }
      paymentId = session.id;
      paymentStatus = session.payment_status ?? "paid";
    }

    let working = order;
    if (
      order.status !== "paid" &&
      order.status !== "shipped" &&
      order.status !== "delivered"
    ) {
      const updated = await updateOrder(id, {
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentId,
        paymentStatus,
      });
      if (updated) working = updated;
    }

    // Enviar correo una sola vez (idempotente entre webhook + landing de éxito)
    let emailSent = Boolean(working.confirmationEmailSentAt);
    let emailError: string | undefined;
    if (!emailSent) {
      const result = await sendOrderConfirmationEmail(working);
      if (result.ok) {
        const stamped = await updateOrder(id, {
          confirmationEmailSentAt: new Date().toISOString(),
        });
        if (stamped) working = stamped;
        emailSent = true;
      } else {
        emailError = result.error;
      }
    }

    return NextResponse.json(
      {
        success: true,
        order: working,
        alreadyConfirmed: order.status === "paid",
        emailSent,
        emailError,
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
