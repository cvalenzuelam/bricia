import { readFile, writeFile } from "fs/promises";
import path from "path";
import { put, list } from "@vercel/blob";
import localMesaData from "./lamesa.json";
import { MemoryCache } from "@/lib/memory-cache";
import { fetchPublicBlobJson } from "@/lib/blob-public-read";
import { localJsonInDev } from "@/lib/dev-data-source";

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string; author?: string }
  | { type: "image"; url: string; alt: string; caption?: string }
  | { type: "gallery"; images: { url: string; alt: string }[] };

export interface MesaArticle {
  slug: string;
  title: string;
  date: string;
  type: "HOSTING" | "ESTÉTICA" | "ILUMINACIÓN" | "MESA";
  readingTime: string;
  excerpt: string;
  coverImage: string;
  coverColor: string;
  body: ContentBlock[];
}

const BLOB_KEY = "bricia/lamesa.json";
const LOCAL_PATH = path.join(process.cwd(), "src/data/lamesa.json");
const LIST_TIMEOUT_MS = 10000;
const FETCH_TIMEOUT_MS = 10000;
const SAVE_TIMEOUT_MS = 15000;

const BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.BLOB_TOKEN ||
  process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

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

/** Evita repetir list() en cada request a páginas que usan La Mesa */
const mesaCache = new MemoryCache<MesaArticle[]>(300_000);

export async function getMesaArticles(): Promise<MesaArticle[]> {
  if (shouldPersistLocally()) {
    try {
      const raw = await readFile(LOCAL_PATH, "utf-8");
      return JSON.parse(raw) as MesaArticle[];
    } catch {
      return localMesaData as MesaArticle[];
    }
  }

  const cached = mesaCache.get();
  if (cached) return cached;

  const viaPublic = await fetchPublicBlobJson<MesaArticle[]>(
    BLOB_KEY,
    FETCH_TIMEOUT_MS
  );
  if (viaPublic && Array.isArray(viaPublic)) {
    mesaCache.set(viaPublic);
    return viaPublic;
  }

  try {
    const { blobs } = await withTimeout(
      list({
        prefix: BLOB_KEY,
        ...(BLOB_TOKEN ? { token: BLOB_TOKEN } : {}),
      }),
      LIST_TIMEOUT_MS,
      "listing mesa blobs"
    );
    if (blobs.length > 0) {
      const latest = blobs.sort((a, b) =>
        b.uploadedAt > a.uploadedAt ? 1 : -1
      )[0];
      const res = await withTimeout(
        fetch(latest.url, { cache: "no-store" }),
        FETCH_TIMEOUT_MS,
        "fetching latest mesa blob"
      );
      const json = (await res.json()) as MesaArticle[];
      mesaCache.set(json);
      return json;
    }
    return localMesaData as MesaArticle[];
  } catch {
    return localMesaData as MesaArticle[];
  }
}

export async function getMesaArticleBySlug(
  slug: string
): Promise<MesaArticle | undefined> {
  const articles = await getMesaArticles();
  return articles.find((a) => a.slug === slug);
}

export async function saveMesaArticles(articles: MesaArticle[]): Promise<void> {
  const payload = JSON.stringify(articles, null, 2);

  if (shouldPersistLocally()) {
    await writeFile(LOCAL_PATH, payload, "utf-8");
    mesaCache.set(articles);
    return;
  }

  if (!BLOB_TOKEN) {
    throw new Error(
      "Falta BLOB_READ_WRITE_TOKEN para guardar artículos. En desarrollo local sin token se usa src/data/lamesa.json."
    );
  }

  await withTimeout(
    put(BLOB_KEY, payload, {
      access: "public",
      allowOverwrite: true,
      contentType: "application/json",
      token: BLOB_TOKEN,
    }),
    SAVE_TIMEOUT_MS,
    "saving mesa blob"
  );
  mesaCache.set(articles);
}

export async function addMesaArticle(article: MesaArticle): Promise<void> {
  const articles = await getMesaArticles();
  articles.unshift(article);
  await saveMesaArticles(articles);
}

export async function updateMesaArticle(
  slug: string,
  updated: Partial<MesaArticle>
): Promise<MesaArticle | null> {
  const articles = await getMesaArticles();
  const index = articles.findIndex((a) => a.slug === slug);
  if (index === -1) return null;
  articles[index] = { ...articles[index], ...updated };
  await saveMesaArticles(articles);
  return articles[index];
}

export async function deleteMesaArticle(slug: string): Promise<boolean> {
  const articles = await getMesaArticles();
  const filtered = articles.filter((a) => a.slug !== slug);
  if (filtered.length === articles.length) return false;
  await saveMesaArticles(filtered);
  return true;
}

export function generateMesaSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Legacy synchronous export — used by client components that still import directly.
// Will match whatever is in the local JSON at build time.
export const mesaArticles: MesaArticle[] = localMesaData as MesaArticle[];
