import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let admin: ReturnType<typeof createSupabaseClient> | null = null;

function createSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
let cachedUrl = "";
let cachedKey = "";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

/**
 * Solo en servidor (API routes, RSC, loaders). Service role puede saltar RLS — no exponer al cliente.
 */
export function createSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  if (!admin || cachedUrl !== url || cachedKey !== key) {
    cachedUrl = url;
    cachedKey = key;
    admin = createSupabaseClient();
  }
  return admin;
}
