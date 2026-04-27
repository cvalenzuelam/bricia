import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

function getBaseUrl(request: NextRequest): string {
  // In production use the custom domain or VERCEL_URL; in dev use localhost
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  if (!ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "Mercado Pago no configurado. Agrega MERCADOPAGO_ACCESS_TOKEN a las variables de entorno." },
      { status: 503 }
    );
  }

  let body: { items: { id: string; name: string; price: number; quantity: number; image: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const { items } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
  const preference = new Preference(client);
  const baseUrl = getBaseUrl(request);

  try {
    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: "MXN",
          picture_url: item.image.startsWith("http") ? item.image : `${baseUrl}${item.image}`,
        })),
        back_urls: {
          success: `${baseUrl}/pago/exito`,
          failure: `${baseUrl}/pago/error`,
          pending: `${baseUrl}/pago/pendiente`,
        },
        auto_return: "approved",
        statement_descriptor: "Bricia Lopez",
        external_reference: `bricia-${Date.now()}`,
      },
    });

    // sandbox_init_point for test; init_point for production
    const checkoutUrl =
      ACCESS_TOKEN.startsWith("TEST-")
        ? result.sandbox_init_point
        : result.init_point;

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("[checkout] MP error:", err);
    return NextResponse.json({ error: "Error al crear la preferencia de pago" }, { status: 500 });
  }
}
