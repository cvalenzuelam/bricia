import { readFile, writeFile } from "fs/promises";
import path from "path";
import localProductsData from "./products.json";
import type { Product } from "./products";
import { MemoryCache } from "@/lib/memory-cache";
import { localJsonInDev } from "@/lib/dev-data-source";
import {
  createSupabaseAdmin,
  isSupabaseConfigured,
} from "@/lib/supabase/admin";
import { normalizeProductGallery } from "@/lib/product-gallery";

const LOCAL_PATH = path.join(process.cwd(), "src/data/products.json");
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

function productRowToProduct(row: Record<string, unknown>): Product {
  const p: Product = {
    id: String(row.id),
    name: String(row.name),
    subtitle: String(row.subtitle ?? ""),
    price: Number(row.price),
    description: String(row.description ?? ""),
    image: String(row.image ?? ""),
    category: String(row.category ?? ""),
    stock: Number(row.stock ?? 0),
  };
  if (row.dimensions != null && String(row.dimensions).length > 0) {
    p.dimensions = String(row.dimensions);
  }
  if (row.material != null && String(row.material).length > 0) {
    p.material = String(row.material);
  }
  const gallery = normalizeProductGallery(row.gallery);
  if (gallery.length > 0) {
    p.gallery = gallery;
  }
  return p;
}

async function fetchProductsFromSupabase(): Promise<Product[]> {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("products")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  return data.map((row) => productRowToProduct(row as Record<string, unknown>));
}

async function syncProductsToSupabase(products: Product[]): Promise<void> {
  const sb = createSupabaseAdmin();
  const wantedIds = new Set(products.map((p) => p.id));

  const { data: existing, error: listErr } = await sb.from("products").select("id");

  if (listErr) throw listErr;

  const ids = (existing ?? []) as { id: string }[];
  const toDelete = ids.filter((r) => !wantedIds.has(r.id)).map((r) => r.id);

  if (toDelete.length > 0) {
    const { error: delErr } = await sb.from("products").delete().in("id", toDelete);
    if (delErr) throw delErr;
  }

  const iso = new Date().toISOString();
  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    price: p.price,
    description: p.description,
    image: p.image,
    gallery: normalizeProductGallery(p.gallery),
    category: p.category,
    stock: p.stock,
    dimensions: p.dimensions ?? null,
    material: p.material ?? null,
    updated_at: iso,
  }));

  const { error: upsertErr } = await sb
    .from("products")
    .upsert(rows, { onConflict: "id" });

  if (upsertErr) throw upsertErr;
}

/** 5 min cache */
const productsCache = new MemoryCache<Product[]>(300_000);

export async function getProducts(): Promise<Product[]> {
  if (shouldPersistLocally()) {
    try {
      const raw = await readFile(LOCAL_PATH, "utf-8");
      return JSON.parse(raw) as Product[];
    } catch {
      return localProductsData as Product[];
    }
  }

  const cached = productsCache.get();
  if (cached) return cached;

  if (!isSupabaseConfigured()) {
    console.warn(
      "[products-server] Sin Supabase en producción: usando src/data/products.json empaquetado"
    );
    return localProductsData as Product[];
  }

  try {
    const viaDb = await withTimeout(
      fetchProductsFromSupabase(),
      FETCH_TIMEOUT_MS,
      "reading products from Supabase"
    );
    productsCache.set(viaDb);
    return viaDb;
  } catch (err) {
    console.error("[products-server] Supabase read failed:", err);
    return localProductsData as Product[];
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  const json = JSON.stringify(products, null, 2);

  if (shouldPersistLocally()) {
    await writeFile(LOCAL_PATH, json, "utf-8");
    return;
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase no está configurado: añade NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para guardar el catálogo en producción."
    );
  }

  await withTimeout(
    syncProductsToSupabase(products),
    SAVE_TIMEOUT_MS,
    "saving products to Supabase"
  );
  productsCache.set(products);
}

export function generateProductId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function addProduct(product: Product): Promise<void> {
  const products = await getProducts();
  products.push(product);
  await saveProducts(products);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
  const products = await getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products[idx] = { ...products[idx], ...updates, id };
  await saveProducts(products);
  return true;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await getProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  await saveProducts(filtered);
  return true;
}
