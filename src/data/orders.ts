import { readFile, writeFile } from "fs/promises";
import path from "path";
import { put, list } from "@vercel/blob";
import localOrdersData from "./orders.json";
import { MemoryCache } from "@/lib/memory-cache";

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  subtitle?: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  street: string;
  exterior: string;
  interior?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes?: string;
}

export interface ShippingMethodSelection {
  id: string;
  name: string;
  eta: string;
  basePrice: number;
}

export interface Order {
  id: string;
  createdAt: string;
  paidAt?: string;
  status: OrderStatus;
  customer: CustomerInfo;
  shipping: ShippingAddress;
  shippingMethod?: ShippingMethodSelection;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentId?: string;
  paymentStatus?: string;
  /** Timestamp ISO when the buyer confirmation email was successfully sent. Used for idempotency. */
  confirmationEmailSentAt?: string;
}

const BLOB_KEY = "bricia/orders.json";
const LOCAL_PATH = path.join(process.cwd(), "src/data/orders.json");
const LIST_TIMEOUT_MS = 10000;
const FETCH_TIMEOUT_MS = 10000;
const SAVE_TIMEOUT_MS = 15000;

const BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.BLOB_TOKEN ||
  process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

function shouldPersistLocally(): boolean {
  const onVercel = Boolean(process.env.VERCEL);
  return !onVercel && !BLOB_TOKEN && process.env.NODE_ENV === "development";
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout while ${label} after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

// Cache breve para /admin/pedidos: evita un list() por cada vista/refresh.
// Las escrituras (saveOrders) actualizan el cache, así que el admin sigue
// viendo datos frescos tras crear/editar/borrar pedidos.
const ordersCache = new MemoryCache<Order[]>(30_000);

export async function getOrders(): Promise<Order[]> {
  if (shouldPersistLocally()) {
    try {
      const raw = await readFile(LOCAL_PATH, "utf-8");
      return JSON.parse(raw) as Order[];
    } catch {
      return localOrdersData as Order[];
    }
  }

  const cached = ordersCache.get();
  if (cached) return cached;

  if (BLOB_TOKEN) {
    try {
      const { blobs } = await withTimeout(
        list({ prefix: BLOB_KEY, token: BLOB_TOKEN }),
        LIST_TIMEOUT_MS,
        "listing blobs"
      );
      const match = blobs.find((b) => b.pathname === BLOB_KEY);
      if (match) {
        const res = await withTimeout(
          fetch(match.url, { cache: "no-store" }),
          FETCH_TIMEOUT_MS,
          "fetching blob"
        );
        if (res.ok) {
          const data = (await res.json()) as Order[];
          ordersCache.set(data);
          return data;
        }
      }
    } catch (err) {
      console.error("[orders] blob read failed:", err);
    }
  }

  return localOrdersData as Order[];
}

export async function saveOrders(orders: Order[]): Promise<void> {
  const json = JSON.stringify(orders, null, 2);

  if (shouldPersistLocally()) {
    await writeFile(LOCAL_PATH, json, "utf-8");
    ordersCache.set(orders);
    return;
  }

  if (BLOB_TOKEN) {
    await withTimeout(
      put(BLOB_KEY, json, {
        access: "public",
        contentType: "application/json",
        token: BLOB_TOKEN,
        allowOverwrite: true,
      }),
      SAVE_TIMEOUT_MS,
      "saving blob"
    );
    ordersCache.set(orders);
    return;
  }

  await writeFile(LOCAL_PATH, json, "utf-8");
  ordersCache.set(orders);
}

export function generateOrderId(): string {
  const date = new Date();
  const yymmdd = date
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BR-${yymmdd}-${random}`;
}

export async function addOrder(order: Order): Promise<void> {
  const orders = await getOrders();
  orders.unshift(order);
  await saveOrders(orders);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export async function updateOrder(
  id: string,
  updates: Partial<Order>
): Promise<Order | null> {
  const orders = await getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...updates, id };
  await saveOrders(orders);
  return orders[idx];
}

export async function findOrderByExternalReference(
  externalRef: string
): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find((o) => o.id === externalRef) ?? null;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const orders = await getOrders();
  const next = orders.filter((o) => o.id !== id);
  if (next.length === orders.length) return false;
  await saveOrders(next);
  return true;
}
