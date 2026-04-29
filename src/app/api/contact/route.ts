import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { MemoryCache } from "@/lib/memory-cache";
import { localJsonInDev } from "@/lib/dev-data-source";
import { CMS_DOC_KEYS, fetchCmsDocument, upsertCmsDocument } from "@/lib/supabase/cms-documents";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const CONFIG_PATH = path.join(process.cwd(), "src/data/contact-config.json");

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export const runtime = "nodejs";

const contactCache = new MemoryCache<unknown>(180_000);

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

    if (localJsonInDev()) {
      const localFirst = readLocalConfig();
      contactCache.set(localFirst);
      return NextResponse.json(localFirst, { headers: PUBLIC_CACHE_HEADERS });
    }

    if (isSupabaseConfigured()) {
      try {
        const remote = await fetchCmsDocument<Record<string, unknown>>(
          CMS_DOC_KEYS.contact
        );
        if (remote && typeof remote === "object") {
          contactCache.set(remote);
          return NextResponse.json(remote, { headers: PUBLIC_CACHE_HEADERS });
        }
      } catch (e) {
        console.error("[contact API] Supabase GET failed:", e);
      }
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

    if (localJsonInDev()) {
      fs.writeFileSync(CONFIG_PATH, payload, "utf-8");
      contactCache.set(body);
      return NextResponse.json({ success: true, local: true });
    }

    if (isSupabaseConfigured()) {
      try {
        await upsertCmsDocument(CMS_DOC_KEYS.contact, body);
        contactCache.set(body);
        return NextResponse.json({ success: true });
      } catch (e) {
        console.error("[contact API] Supabase PUT failed:", e);
      }
    }

    fs.writeFileSync(CONFIG_PATH, payload, "utf-8");
    contactCache.set(body);
    return NextResponse.json({ success: true, local: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al guardar: ${message}` },
      { status: 500 }
    );
  }
}
