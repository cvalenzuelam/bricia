import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { getOrderById } from "@/data/orders";
import type { Order } from "@/data/orders";

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

function getBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  if (!ACCESS_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Mercado Pago no configurado. Agrega MERCADOPAGO_ACCESS_TOKEN a las variables de entorno.",
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

  // Blob puede tardar unos ms en reflejar escrituras recientes; reintentamos.
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
    return NextResponse.json(
      { error: "Pedido no encontrado" },
      { status: 404 }
    );
  }

  const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
  const preference = new Preference(client);
  const baseUrl = getBaseUrl(request);

  const items = order.items.map((item) => ({
    id: item.productId,
    title: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    currency_id: "MXN",
    picture_url: item.image.startsWith("http")
      ? item.image
      : `${baseUrl}${item.image}`,
  }));

  // Agregar envío como item separado si no es gratis
  if (order.shippingCost > 0) {
    items.push({
      id: "envio",
      title: "Envío a domicilio",
      quantity: 1,
      unit_price: order.shippingCost,
      currency_id: "MXN",
      picture_url: "",
    });
  }

  // Separar nombre completo en first/last para MP
  const nameParts = order.customer.name.trim().split(/\s+/);
  const firstName = nameParts.slice(0, Math.max(1, nameParts.length - 1)).join(" ");
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const streetNumberStr =
    order.shipping.exterior.trim() || "S/N";

  try {
    const result = await preference.create({
      body: {
        items,
        payer: {
          name: firstName,
          surname: lastName,
          email: order.customer.email,
          phone: {
            area_code: "",
            number: order.customer.phone,
          },
          address: {
            zip_code: order.shipping.zip,
            street_name: order.shipping.street,
            street_number: streetNumberStr,
          },
        },
        shipments: {
          receiver_address: {
            zip_code: order.shipping.zip,
            street_name: order.shipping.street,
            street_number: streetNumberStr,
            city_name: order.shipping.city,
            state_name: order.shipping.state,
          },
        },
        back_urls: {
          success: `${baseUrl}/pago/exito?orderId=${order.id}`,
          failure: `${baseUrl}/pago/error?orderId=${order.id}`,
          pending: `${baseUrl}/pago/pendiente?orderId=${order.id}`,
        },
        auto_return: "approved",
        statement_descriptor: "Bricia Lopez",
        external_reference: order.id,
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      },
    });

    const checkoutUrl = ACCESS_TOKEN.startsWith("TEST-")
      ? result.sandbox_init_point
      : result.init_point;

    return NextResponse.json({ checkoutUrl, orderId: order.id });
  } catch (err) {
    console.error("[checkout] MP error:", err);
    return NextResponse.json(
      { error: "Error al crear la preferencia de pago" },
      { status: 500 }
    );
  }
}
