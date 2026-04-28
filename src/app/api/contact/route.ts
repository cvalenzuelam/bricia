import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { list, put } from "@vercel/blob";
import { MemoryCache } from "@/lib/memory-cache";

const CONFIG_PATH = path.join(process.cwd(), "src/data/contact-config.json");
const CONTACT_BLOB_KEY = "bricia/contact-config.json";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control":
    "public, s-maxage=60, stale-while-revalidate=300",
};

export const runtime = "nodejs";

const contactCache = new MemoryCache<unknown>(60_000);

function readLocalConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

export async function GET() {
  try {
    const cached = contactCache.get();
    if (cached) {
      return NextResponse.json(cached, { headers: PUBLIC_CACHE_HEADERS });
    }

    try {
      const { blobs } = await list({ prefix: CONTACT_BLOB_KEY });
      if (blobs.length > 0) {
        const latest = blobs.sort((a, b) => (b.uploadedAt > a.uploadedAt ? 1 : -1))[0];
        const res = await fetch(latest.url, { cache: "no-store" });
        if (res.ok) {
          const blobConfig = await res.json();
          contactCache.set(blobConfig);
          return NextResponse.json(blobConfig, { headers: PUBLIC_CACHE_HEADERS });
        }
      }
    } catch {
      // fall back to local file
    }

    const localConfig = readLocalConfig();
    contactCache.set(localConfig);
    return NextResponse.json(localConfig, { headers: PUBLIC_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Error al cargar configuración de contacto" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = JSON.stringify(body, null, 2);

    try {
      await put(CONTACT_BLOB_KEY, payload, {
        access: "public",
        allowOverwrite: true,
        contentType: "application/json",
      });
      contactCache.set(body);
      return NextResponse.json({ success: true });
    } catch {
      fs.writeFileSync(CONFIG_PATH, payload, "utf-8");
      contactCache.set(body);
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
