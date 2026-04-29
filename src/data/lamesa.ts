import { readFile, writeFile } from "fs/promises";
import path from "path";
import localMesaData from "./lamesa.json";
import { MemoryCache } from "@/lib/memory-cache";
import { localJsonInDev } from "@/lib/dev-data-source";
import { CMS_DOC_KEYS, fetchCmsDocument, upsertCmsDocument } from "@/lib/supabase/cms-documents";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

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

const LOCAL_PATH = path.join(process.cwd(), "src/data/lamesa.json");
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

  if (isSupabaseConfigured()) {
    try {
      const remote = await withTimeout(
        fetchCmsDocument<MesaArticle[]>(CMS_DOC_KEYS.lamesa),
        FETCH_TIMEOUT_MS,
        "reading La Mesa from Supabase"
      );
      if (Array.isArray(remote)) {
        mesaCache.set(remote);
        return remote;
      }
    } catch (e) {
      console.error("[lamesa] Supabase read failed:", e);
    }
  }

  const fallback = localMesaData as MesaArticle[];
  mesaCache.set(fallback);
  return fallback;
}

export async function getMesaArticleBySlug(slug: string): Promise<MesaArticle | undefined> {
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

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Configura Supabase (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) para guardar La Mesa."
    );
  }

  await withTimeout(
    upsertCmsDocument(CMS_DOC_KEYS.lamesa, articles),
    SAVE_TIMEOUT_MS,
    "saving La Mesa to Supabase"
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

export const mesaArticles: MesaArticle[] = localMesaData as MesaArticle[];
