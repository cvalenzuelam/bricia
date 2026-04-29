import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { findOrderByExternalReference, updateOrder } from "@/data/orders";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Webhook Stripe — evento principal: checkout.session.completed
 * Configurar en: https://dashboard.stripe.com/webhooks
 * URL: https://TU_DOMINIO/api/webhooks/stripe
 * En local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  if (!WEBHOOK_SECRET) {
    console.warn("[webhook stripe] STRIPE_WEBHOOK_SECRET no configurado");
    return NextResponse.json({ ok: false, reason: "no secret" }, { status: 200 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhook stripe] firma inválida:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) {
    console.warn("[webhook stripe] sesión sin orderId", session.id);
    return NextResponse.json({ ok: false, reason: "no order id" }, { status: 200 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json(
      { ok: true, ignored: session.payment_status },
      { status: 200 }
    );
  }

  try {
    const order = await findOrderByExternalReference(orderId);
    if (!order) {
      console.warn("[webhook stripe] orden no encontrada:", orderId);
      return NextResponse.json({ ok: false, reason: "order not found" }, { status: 200 });
    }

    const expected = session.metadata?.expectedTotalCents;
    if (
      expected &&
      session.amount_total != null &&
      String(session.amount_total) !== expected
    ) {
      console.error("[webhook stripe] monto no coincide pedido", {
        session: session.amount_total,
        expected,
        orderId,
      });
      return NextResponse.json({ ok: false, reason: "amount mismatch" }, { status: 200 });
    }

    let working = order;
    if (order.status === "pending") {
      const updated = await updateOrder(order.id, {
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentId: session.id,
        paymentStatus: session.payment_status ?? "paid",
      });
      if (updated) working = updated;
    }

    if (!working.confirmationEmailSentAt) {
      const result = await sendOrderConfirmationEmail(working);
      if (result.ok) {
        await updateOrder(working.id, {
          confirmationEmailSentAt: new Date().toISOString(),
        });
      } else {
        console.error("[webhook stripe] email:", result.error);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[webhook stripe]", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
