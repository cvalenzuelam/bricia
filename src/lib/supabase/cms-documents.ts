import type { Json } from "./database.types";
import { createSupabaseAdmin, isSupabaseConfigured } from "./admin";

/** Antiguos pathnames Blob en forma de una clave estable por documento */
export const CMS_DOC_KEYS = {
  hero: "hero_config",
  contact: "contact_config",
  recipes: "recipes",
  lamesa: "lamesa_articles",
  orders: "orders",
} as const;

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

export async function fetchCmsDocument<T>(docKey: string): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("cms_documents")
    .select("payload")
    .eq("doc_key", docKey)
    .maybeSingle();

  if (error) throw error;
  if (data?.payload === undefined || data.payload === null) return null;

  return data.payload as T;
}

export async function upsertCmsDocument(docKey: string, payload: unknown): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase no está configurado (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  const sb = createSupabaseAdmin();
  const { error } = await sb.from("cms_documents").upsert(
    {
      doc_key: docKey,
      payload: toJson(payload),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "doc_key" }
  );

  if (error) throw error;
}
