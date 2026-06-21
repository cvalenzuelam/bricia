import fs from "fs";
import path from "path";
import { MemoryCache } from "@/lib/memory-cache";
import { localJsonInDev } from "@/lib/dev-data-source";
import { CMS_DOC_KEYS, fetchCmsDocument, upsertCmsDocument } from "@/lib/supabase/cms-documents";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { DEFAULT_SHOP_CONFIG, normalizeShopConfig, type ShopConfig } from "@/data/shop-config";

const CONFIG_PATH = path.join(process.cwd(), "src/data/shop-config.json");

const shopConfigCache = new MemoryCache<ShopConfig>(180_000);

export function readLocalShopJson(): ShopConfig {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return normalizeShopConfig(JSON.parse(raw));
}

export function setCachedShopConfig(next: ShopConfig) {
  shopConfigCache.set(next);
}

export async function loadShopConfig(): Promise<ShopConfig> {
  // En dev local, siempre leer disco para reflejar al instante los cambios del CMS.
  if (localJsonInDev()) {
    const localFirst = readLocalShopJson();
    shopConfigCache.set(localFirst);
    return localFirst;
  }

  const cached = shopConfigCache.get();
  if (cached) return cached;

  if (isSupabaseConfigured()) {
    try {
      const remote = await fetchCmsDocument<unknown>(CMS_DOC_KEYS.shop);
      if (remote) {
        const normalized = normalizeShopConfig(remote);
        shopConfigCache.set(normalized);
        return normalized;
      }
    } catch (e) {
      console.error("[shop-config] Supabase load failed:", e);
    }
  }

  try {
    const localConfig = readLocalShopJson();
    shopConfigCache.set(localConfig);
    return localConfig;
  } catch {
    shopConfigCache.set(DEFAULT_SHOP_CONFIG);
    return DEFAULT_SHOP_CONFIG;
  }
}

export async function persistShopConfig(body: ShopConfig) {
  const normalized = normalizeShopConfig(body);
  const payloadStr = JSON.stringify(normalized, null, 2);

  if (localJsonInDev()) {
    fs.writeFileSync(CONFIG_PATH, payloadStr, "utf-8");
    setCachedShopConfig(normalized);
    return { ok: true as const, localOnly: true as const };
  }

  if (isSupabaseConfigured()) {
    try {
      await upsertCmsDocument(CMS_DOC_KEYS.shop, normalized);
      setCachedShopConfig(normalized);
      return { ok: true as const, localOnly: false as const };
    } catch (e) {
      console.error("[shop-config] Supabase persist failed:", e);
    }
  }

  fs.writeFileSync(CONFIG_PATH, payloadStr, "utf-8");
  setCachedShopConfig(normalized);
  return { ok: true as const, localOnly: true as const };
}
