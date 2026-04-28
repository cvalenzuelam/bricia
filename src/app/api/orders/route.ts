import { NextRequest, NextResponse } from "next/server";
import {
  addOrder,
  generateOrderId,
  getOrders,
  type Order,
} from "@/data/orders";
import { calculateShipping, getShippingOptionById } from "@/lib/shipping";
import { validateCheckoutOrderBody } from "@/lib/checkout-validation";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json(orders, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { error: "Error al cargar pedidos" },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer, shipping, shippingMethod, items } = body;

    const validated = validateCheckoutOrderBody({ customer, shipping });
    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error },
        { status: 400, headers: NO_STORE }
      );
    }
    const { form } = validated;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, it: { price: number; quantity: number }) =>
        sum + it.price * it.quantity,
      0
    );
    const selectedShippingMethod = getShippingOptionById(shippingMethod?.id);
    const shippingCost = calculateShipping(subtotal, selectedShippingMethod.price);
    const total = subtotal + shippingCost;

    const order: Order = {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      status: "pending",
      customer: {
        name: form.name,
        email: form.email.toLowerCase(),
        phone: form.phone,
      },
      shipping: {
        street: form.street,
        exterior: form.exterior,
        interior: form.interior || undefined,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country:
          typeof shipping?.country === "string" && shipping.country.trim()
            ? shipping.country.trim()
            : "México",
        notes: form.notes || undefined,
      },
      shippingMethod: {
        id: selectedShippingMethod.id,
        name: selectedShippingMethod.name,
        eta: selectedShippingMethod.eta,
        basePrice: selectedShippingMethod.price,
      },
      items: items.map(
        (it: {
          productId: string;
          name: string;
          subtitle?: string;
          price: number;
          quantity: number;
          image: string;
        }) => ({
          productId: it.productId,
          name: it.name,
          subtitle: it.subtitle,
          price: Number(it.price),
          quantity: Number(it.quantity),
          image: it.image,
        })
      ),
      subtotal,
      shippingCost,
      total,
    };

    await addOrder(order);
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err) {
    console.error("[orders POST]", err);
    return NextResponse.json(
      { error: "Error al crear pedido" },
      { status: 500 }
    );
  }
}
