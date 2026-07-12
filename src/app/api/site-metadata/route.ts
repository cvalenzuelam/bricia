import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  loadSiteMetadata,
  persistSiteMetadata,
} from "@/data/site-metadata-loader";
import type { SiteMetadataConfig } from "@/data/site-metadata-types";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export const runtime = "nodejs";

export async function GET() {
  try {
    const config = await loadSiteMetadata();
    return NextResponse.json(config, { headers: PUBLIC_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Error al cargar metadatos del sitio" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as SiteMetadataConfig;
    const payload = JSON.stringify(body, null, 2);
    const result = await persistSiteMetadata(payload, body);
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, local: result.localOnly });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al guardar: ${message}` },
      { status: 500 }
    );
  }
}
