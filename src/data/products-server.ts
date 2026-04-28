import { readFile, writeFile } from "fs/promises";
import path from "path";
import { put, list } from "@vercel/blob";
import localProductsData from "./products.json";
import type { Product } from "./products";
import { MemoryCache } from "@/lib/memory-cache";

const BLOB_KEY = "bricia/products.json";
const LOCAL_PATH = path.join(process.cwd(), "src/data/products.json");
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

const productsCache = new MemoryCache<Product[]>(60_000);

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
          const data = (await res.json()) as Product[];
          productsCache.set(data);
          return data;
        }
      }
    } catch (err) {
      console.error("[products-server] blob read failed:", err);
    }
  }

  return localProductsData as Product[];
}

export async function saveProducts(products: Product[]): Promise<void> {
  const json = JSON.stringify(products, null, 2);

  if (shouldPersistLocally()) {
    await writeFile(LOCAL_PATH, json, "utf-8");
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
    productsCache.set(products);
    return;
  }

  await writeFile(LOCAL_PATH, json, "utf-8");
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
