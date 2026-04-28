import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { list, put } from "@vercel/blob";
import { MemoryCache } from "@/lib/memory-cache";

const CONFIG_PATH = path.join(process.cwd(), "src/data/hero-config.json");
const HERO_BLOB_KEY = "bricia/hero-config.json";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control":
    "public, s-maxage=60, stale-while-revalidate=300",
};

export const runtime = "nodejs";

const heroCache = new MemoryCache<unknown>(60_000);

function readLocalHeroConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw);
}

export async function GET() {
  try {
    const cached = heroCache.get();
    if (cached) {
      return NextResponse.json(cached, { headers: PUBLIC_CACHE_HEADERS });
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
          heroCache.set(blobConfig);
          return NextResponse.json(blobConfig, { headers: PUBLIC_CACHE_HEADERS });
        }
      }
    } catch {
      // fall back to local file
    }

    const localConfig = readLocalHeroConfig();
    heroCache.set(localConfig);
    return NextResponse.json(localConfig, { headers: PUBLIC_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Error al cargar configuración" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = JSON.stringify(body, null, 2);

    try {
      await put(HERO_BLOB_KEY, payload, {
        access: "public",
        allowOverwrite: true,
        contentType: "application/json",
      });
      heroCache.set(body);
      return NextResponse.json({ success: true });
    } catch {
      fs.writeFileSync(CONFIG_PATH, payload, "utf-8");
      heroCache.set(body);
      return NextResponse.json({ success: true, local: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al guardar: ${message}` },
      { status: 500 }
    );
  }
}
