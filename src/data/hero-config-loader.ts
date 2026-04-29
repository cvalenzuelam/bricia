import fs from "fs";
import path from "path";
import { MemoryCache } from "@/lib/memory-cache";
import { localJsonInDev } from "@/lib/dev-data-source";
import { CMS_DOC_KEYS, fetchCmsDocument, upsertCmsDocument } from "@/lib/supabase/cms-documents";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const CONFIG_PATH = path.join(process.cwd(), "src/data/hero-config.json");

const heroPayloadCache = new MemoryCache<unknown>(180_000);

export function readLocalHeroJson() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

/** Invalidar tras PUT en la ruta API (mismo proceso). */
export function setCachedHeroPayload(next: unknown) {
  heroPayloadCache.set(next);
}

/** Carga única usada por GET /api/hero y por el servidor del home. */
export async function loadHeroPayload(): Promise<unknown> {
  const cached = heroPayloadCache.get();
  if (cached) return cached;

  if (localJsonInDev()) {
    const localFirst = readLocalHeroJson();
    heroPayloadCache.set(localFirst);
    return localFirst;
  }

  if (isSupabaseConfigured()) {
    try {
      const remote = await fetchCmsDocument<Record<string, unknown>>(
        CMS_DOC_KEYS.hero
      );
      if (remote && typeof remote === "object") {
        heroPayloadCache.set(remote);
        return remote;
      }
    } catch (e) {
      console.error("[hero-config] Supabase load failed:", e);
    }
  }

  const localConfig = readLocalHeroJson();
  heroPayloadCache.set(localConfig);
  return localConfig;
}

/** Persistir vía Supabase o disco local. */
export async function persistHeroPayloadJson(payloadStr: string, bodyParsed: unknown) {
  if (localJsonInDev()) {
    fs.writeFileSync(CONFIG_PATH, payloadStr, "utf-8");
    setCachedHeroPayload(bodyParsed);
    return { ok: true as const, localOnly: true as const };
  }

  if (isSupabaseConfigured()) {
    try {
      await upsertCmsDocument(CMS_DOC_KEYS.hero, JSON.parse(payloadStr));
      setCachedHeroPayload(bodyParsed);
      return { ok: true as const, localOnly: false as const };
    } catch (e) {
      console.error("[hero-config] Supabase persist failed:", e);
    }
  }

  fs.writeFileSync(CONFIG_PATH, payloadStr, "utf-8");
  setCachedHeroPayload(bodyParsed);
  return { ok: true as const, localOnly: true as const };
}
