import fs from "fs";
import path from "path";
import { MemoryCache } from "@/lib/memory-cache";
import { localJsonInDev } from "@/lib/dev-data-source";
import { CMS_DOC_KEYS, fetchCmsDocument, upsertCmsDocument } from "@/lib/supabase/cms-documents";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  DEFAULT_SITE_METADATA,
  type SiteMetadataConfig,
} from "@/data/site-metadata-types";

export type { SiteMetadataConfig };
export { DEFAULT_SITE_METADATA };

const CONFIG_PATH = path.join(process.cwd(), "src/data/site-metadata-config.json");

const siteMetadataCache = new MemoryCache<SiteMetadataConfig>(180_000);

function normalizeConfig(raw: unknown): SiteMetadataConfig {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    title:
      typeof data.title === "string" && data.title.trim()
        ? data.title.trim()
        : DEFAULT_SITE_METADATA.title,
    description:
      typeof data.description === "string" && data.description.trim()
        ? data.description.trim()
        : DEFAULT_SITE_METADATA.description,
    ogImageSrc: typeof data.ogImageSrc === "string" ? data.ogImageSrc.trim() : "",
    ogImageAlt:
      typeof data.ogImageAlt === "string" && data.ogImageAlt.trim()
        ? data.ogImageAlt.trim()
        : DEFAULT_SITE_METADATA.ogImageAlt,
  };
}

export function readLocalSiteMetadata(): SiteMetadataConfig {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8").replace(/^\uFEFF/, "");
  return normalizeConfig(JSON.parse(raw));
}

export function setCachedSiteMetadata(next: SiteMetadataConfig) {
  siteMetadataCache.set(next);
}

export async function loadSiteMetadata(): Promise<SiteMetadataConfig> {
  const cached = siteMetadataCache.get();
  if (cached) return cached;

  if (localJsonInDev()) {
    const localFirst = readLocalSiteMetadata();
    siteMetadataCache.set(localFirst);
    return localFirst;
  }

  if (isSupabaseConfigured()) {
    try {
      const remote = await fetchCmsDocument<Record<string, unknown>>(
        CMS_DOC_KEYS.siteMetadata
      );
      if (remote && typeof remote === "object") {
        const normalized = normalizeConfig(remote);
        siteMetadataCache.set(normalized);
        return normalized;
      }
    } catch (e) {
      console.error("[site-metadata] Supabase load failed:", e);
    }
  }

  const localConfig = readLocalSiteMetadata();
  siteMetadataCache.set(localConfig);
  return localConfig;
}

export async function persistSiteMetadata(
  payloadStr: string,
  bodyParsed: unknown
): Promise<{ ok: true; localOnly: boolean }> {
  const normalized = normalizeConfig(bodyParsed);

  if (localJsonInDev()) {
    fs.writeFileSync(CONFIG_PATH, payloadStr, "utf-8");
    setCachedSiteMetadata(normalized);
    return { ok: true, localOnly: true };
  }

  if (isSupabaseConfigured()) {
    try {
      await upsertCmsDocument(CMS_DOC_KEYS.siteMetadata, normalized);
      setCachedSiteMetadata(normalized);
      return { ok: true, localOnly: false };
    } catch (e) {
      console.error("[site-metadata] Supabase persist failed:", e);
    }
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(normalized, null, 2), "utf-8");
  setCachedSiteMetadata(normalized);
  return { ok: true, localOnly: true };
}

export function resolveSiteOrigin(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (base) return base;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "https://casabricia.com";
}

/** Convierte ruta relativa o URL absoluta en URL absoluta para og:image. */
export function toAbsoluteAssetUrl(src: string, origin: string): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${origin}${src.startsWith("/") ? src : `/${src}`}`;
}
