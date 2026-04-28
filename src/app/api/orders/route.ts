import { NextRequest, NextResponse } from "next/server";
import {
  addOrder,
  generateOrderId,
  getOrders,
  type Order,
} from "@/data/orders";
import { calculateShipping, getShippingOptionById } from "@/lib/shipping";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isNonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

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

    if (
      !customer ||
      !isNonEmpty(customer.name) ||
      !isNonEmpty(customer.email) ||
      !isValidEmail(customer.email) ||
      !isNonEmpty(customer.phone)
    ) {
      return NextResponse.json(
        { error: "Datos del cliente incompletos o inválidos" },
        { status: 400 }
      );
    }

    if (
      !shipping ||
      !isNonEmpty(shipping.street) ||
      !isNonEmpty(shipping.exterior) ||
      !isNonEmpty(shipping.neighborhood) ||
      !isNonEmpty(shipping.city) ||
      !isNonEmpty(shipping.state) ||
      !isNonEmpty(shipping.zip)
    ) {
      return NextResponse.json(
        { error: "Dirección de envío incompleta" },
        { status: 400 }
      );
    }

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
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim(),
      },
      shipping: {
        street: shipping.street.trim(),
        exterior: shipping.exterior.trim(),
        interior: shipping.interior?.trim() || undefined,
        neighborhood: shipping.neighborhood.trim(),
        city: shipping.city.trim(),
        state: shipping.state.trim(),
        zip: shipping.zip.trim(),
        country: shipping.country?.trim() || "México",
        notes: shipping.notes?.trim() || undefined,
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
