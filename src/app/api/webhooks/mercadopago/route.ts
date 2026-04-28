import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { findOrderByExternalReference, updateOrder } from "@/data/orders";
import { sendOrderConfirmationEmail } from "@/lib/email";

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

/**
 * Mercado Pago Webhook
 * MP envía notificaciones cuando hay actualizaciones de pago.
 * Configurar en: https://www.mercadopago.com.mx/developers/panel/app/{appId}/webhooks
 * Eventos a suscribir: payment
 * URL: https://casabricia.vercel.app/api/webhooks/mercadopago
 *
 * Validamos consultando directamente a la API de MP en lugar de confiar en el body.
 */
export async function POST(request: NextRequest) {
  if (!ACCESS_TOKEN) {
    console.warn("[webhook MP] MERCADOPAGO_ACCESS_TOKEN no configurado");
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  let body: { type?: string; action?: string; data?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid body" }, { status: 200 });
  }

  // MP envía notificaciones de varios tipos. Solo nos interesan pagos.
  const isPayment =
    body.type === "payment" ||
    body.action?.startsWith("payment.");

  if (!isPayment) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return NextResponse.json({ ok: false, reason: "no payment id" }, { status: 200 });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    const externalRef = payment.external_reference;
    if (!externalRef) {
      return NextResponse.json({ ok: false, reason: "no external reference" }, { status: 200 });
    }

    const order = await findOrderByExternalReference(externalRef);
    if (!order) {
      console.warn("[webhook MP] orden no encontrada:", externalRef);
      return NextResponse.json({ ok: false, reason: "order not found" }, { status: 200 });
    }

    const status = payment.status; // "approved", "pending", "rejected", etc.

    if (status === "approved") {
      // Marcar como pagado solo si aún no lo está (idempotente)
      let working = order;
      if (order.status === "pending") {
        const updated = await updateOrder(order.id, {
          status: "paid",
          paidAt: new Date().toISOString(),
          paymentId: String(paymentId),
          paymentStatus: status,
        });
        if (updated) working = updated;
      }

      // Enviar correo de confirmación una sola vez
      if (!working.confirmationEmailSentAt) {
        const sent = await sendOrderConfirmationEmail(working);
        if (sent) {
          await updateOrder(working.id, {
            confirmationEmailSentAt: new Date().toISOString(),
          });
        }
      }
    } else if (status && order.status === "pending") {
      // Persistir el estado aunque no sea aprobado para visibilidad en admin
      await updateOrder(order.id, {
        paymentId: String(paymentId),
        paymentStatus: status,
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[webhook MP] error:", err);
    // Devolvemos 200 para que MP no reintente eternamente; ya está logueado
    return NextResponse.json({ ok: false, error: "internal" }, { status: 200 });
  }
}

// MP a veces hace GET para validar la URL
export async function GET() {
  return NextResponse.json({ ok: true });
}
