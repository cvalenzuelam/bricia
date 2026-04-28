import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { list, put } from "@vercel/blob";

const CONFIG_PATH = path.join(process.cwd(), "src/data/contact-config.json");
const CONTACT_BLOB_KEY = "bricia/contact-config.json";
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export const runtime = "nodejs";

function readLocalConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

export async function GET() {
  try {
    try {
      const { blobs } = await list({ prefix: CONTACT_BLOB_KEY });
      if (blobs.length > 0) {
        const latest = blobs.sort((a, b) => (b.uploadedAt > a.uploadedAt ? 1 : -1))[0];
        const res = await fetch(latest.url, { cache: "no-store" });
        if (res.ok) {
          const blobConfig = await res.json();
          return NextResponse.json(blobConfig, { headers: NO_STORE_HEADERS });
        }
      }
    } catch {
      // fall back to local file
    }

    const localConfig = readLocalConfig();
    return NextResponse.json(localConfig, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Error al cargar configuración de contacto" },
      { status: 500, headers: NO_STORE_HEADERS }
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
      return NextResponse.json({ success: true });
    } catch {
      fs.writeFileSync(CONFIG_PATH, payload, "utf-8");
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
