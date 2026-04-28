import fs from "fs";
import path from "path";
import { list, put } from "@vercel/blob";
import { MemoryCache } from "@/lib/memory-cache";
import { fetchPublicBlobJson } from "@/lib/blob-public-read";
import { localJsonInDev } from "@/lib/dev-data-source";

const CONFIG_PATH = path.join(process.cwd(), "src/data/hero-config.json");
export const HERO_BLOB_KEY = "bricia/hero-config.json";

const heroPayloadCache = new MemoryCache<unknown>(180_000);

export function readLocalHeroJson() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

/** Invalidar tras PUT en la ruta API (mismo proceso). */
export function setCachedHeroPayload(next: unknown) {
  heroPayloadCache.set(next);
}

/** Carga única usada por GET /api/hero y por el servidor del home (evita más invocaciones / fetch repetidos). */
export async function loadHeroPayload(): Promise<unknown> {
  const cached = heroPayloadCache.get();
  if (cached) return cached;

  if (localJsonInDev()) {
    const localFirst = readLocalHeroJson();
    heroPayloadCache.set(localFirst);
    return localFirst;
  }

  const direct = await fetchPublicBlobJson<Record<string, unknown>>(
    HERO_BLOB_KEY,
    10000
  );
  if (direct && typeof direct === "object") {
    heroPayloadCache.set(direct);
    return direct;
  }

  try {
    const { blobs } = await list({ prefix: HERO_BLOB_KEY });
    if (blobs.length > 0) {
      const latest = blobs.sort((a, b) =>
        b.uploadedAt > a.uploadedAt ? 1 : -1
      )[0];
      const res = await fetch(latest.url, { cache: "no-store" });
      if (res.ok) {
        const blobConfig = await res.json();
        heroPayloadCache.set(blobConfig);
        return blobConfig;
      }
    }
  } catch {
    /* fallthrough */
  }

  const localConfig = readLocalHeroJson();
  heroPayloadCache.set(localConfig);
  return localConfig;
}

/** Persistir en Blob o disco (usado desde la ruta PUT). La lógica sigue igual que antes. */
export async function persistHeroPayloadJson(payloadStr: string, bodyParsed: unknown) {
  if (localJsonInDev()) {
    fs.writeFileSync(CONFIG_PATH, payloadStr, "utf-8");
    setCachedHeroPayload(bodyParsed);
    return { ok: true as const, localOnly: true as const };
  }

  try {
    await put(HERO_BLOB_KEY, payloadStr, {
      access: "public",
      allowOverwrite: true,
      contentType: "application/json",
    });
    setCachedHeroPayload(bodyParsed);
    return { ok: true as const, localOnly: false as const };
  } catch {
    fs.writeFileSync(CONFIG_PATH, payloadStr, "utf-8");
    setCachedHeroPayload(bodyParsed);
    return { ok: true as const, localOnly: true as const };
  }
}
