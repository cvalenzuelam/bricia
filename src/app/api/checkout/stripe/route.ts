import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/data/orders";
import type { Order } from "@/data/orders";
import { getRequestBaseUrl } from "@/lib/request-base-url";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

function toStripeMxCents(value: number): number {
  return Math.round(value * 100);
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe no configurado. Agrega STRIPE_SECRET_KEY a las variables de entorno.",
      },
      { status: 503 }
    );
  }

  let body: { orderId?: string; orderSnapshot?: Order };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido" },
      { status: 400 }
    );
  }

  const { orderId, orderSnapshot } = body;
  if (!orderId) {
    return NextResponse.json(
      { error: "Falta el identificador del pedido" },
      { status: 400 }
    );
  }

  let order = await getOrderById(orderId);
  if (!order) {
    for (let i = 0; i < 3; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      order = await getOrderById(orderId);
      if (order) break;
    }
  }

  if (!order && orderSnapshot?.id === orderId) {
    order = orderSnapshot;
  }

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const baseUrl = getRequestBaseUrl(request);
  const stripe = getStripe();

  const lineItems = order.items.map((item) => {
    const image =
      item.image.startsWith("http") ? item.image : `${baseUrl}${item.image}`;
    return {
      quantity: item.quantity,
      price_data: {
        currency: "mxn",
        unit_amount: toStripeMxCents(item.price),
        product_data: {
          name: item.name,
          ...(item.subtitle ? { description: item.subtitle } : {}),
          images: [image],
        },
      },
    };
  });

  if (order.shippingCost > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "mxn",
        unit_amount: toStripeMxCents(order.shippingCost),
        product_data: {
          name: `${order.shippingMethod?.name ?? "Envío"}${order.shippingMethod?.eta ? ` · ${order.shippingMethod.eta}` : ""}`,
          images: [],
        },
      },
    });
  }

  const expectedTotalCents = toStripeMxCents(order.total);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${baseUrl}/pago/exito?orderId=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url: `${baseUrl}/checkout`,
      customer_email: order.customer.email,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        expectedTotalCents: String(expectedTotalCents),
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
        },
      },
    });

    const checkoutUrl = session.url;
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Stripe no devolvió URL de checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl,
      sessionId: session.id,
      orderId: order.id,
    });
  } catch (err) {
    console.error("[checkout stripe]", err);
    return NextResponse.json(
      { error: "Error al crear la sesión de pago con Stripe" },
      { status: 500 }
    );
  }
}
