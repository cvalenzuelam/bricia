import { NextRequest, NextResponse } from "next/server";
import { loadHeroPayload, persistHeroPayloadJson } from "@/data/hero-config-loader";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control":
    "public, s-maxage=60, stale-while-revalidate=300",
};

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await loadHeroPayload();
    return NextResponse.json(data, { headers: PUBLIC_CACHE_HEADERS });
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

    const result = await persistHeroPayloadJson(payload, body);
    return NextResponse.json({
      success: true,
      ...(result.localOnly ? { local: true } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al guardar: ${message}` },
      { status: 500 }
    );
  }
}
