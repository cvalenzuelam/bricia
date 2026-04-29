import { readFile, writeFile } from "fs/promises";
import path from "path";
import localOrdersData from "./orders.json";
import { MemoryCache } from "@/lib/memory-cache";
import { localJsonInDev } from "@/lib/dev-data-source";
import { CMS_DOC_KEYS, fetchCmsDocument, upsertCmsDocument } from "@/lib/supabase/cms-documents";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

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
  confirmationEmailSentAt?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  shippingEmailSentAt?: string;
}

const LOCAL_PATH = path.join(process.cwd(), "src/data/orders.json");
const FETCH_TIMEOUT_MS = 10000;
const SAVE_TIMEOUT_MS = 15000;

function shouldPersistLocally(): boolean {
  return localJsonInDev();
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

const ordersCache = new MemoryCache<Order[]>(60_000);

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

  if (isSupabaseConfigured()) {
    try {
      const remote = await withTimeout(
        fetchCmsDocument<Order[]>(CMS_DOC_KEYS.orders),
        FETCH_TIMEOUT_MS,
        "reading orders from Supabase"
      );
      if (Array.isArray(remote)) {
        ordersCache.set(remote);
        return remote;
      }
    } catch (err) {
      console.error("[orders] Supabase read failed:", err);
    }
  }

  const fallback = localOrdersData as Order[];
  ordersCache.set(fallback);
  return fallback;
}

export async function saveOrders(orders: Order[]): Promise<void> {
  const json = JSON.stringify(orders, null, 2);

  if (shouldPersistLocally()) {
    await writeFile(LOCAL_PATH, json, "utf-8");
    ordersCache.set(orders);
    return;
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Configura Supabase (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) para guardar pedidos."
    );
  }

  await withTimeout(
    upsertCmsDocument(CMS_DOC_KEYS.orders, orders),
    SAVE_TIMEOUT_MS,
    "saving orders to Supabase"
  );
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
