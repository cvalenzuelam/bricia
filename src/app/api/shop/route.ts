import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { loadShopConfig, persistShopConfig } from "@/data/shop-config-loader";
import { normalizeShopConfig } from "@/data/shop-config";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export const runtime = "nodejs";

export async function GET() {
  try {
    const config = await loadShopConfig();
    return NextResponse.json(config, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Error al cargar configuración de la tienda" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const normalized = normalizeShopConfig(body);
    const result = await persistShopConfig(normalized);
    revalidatePath("/");
    revalidatePath("/productos");
    revalidatePath("/productos/[id]", "page");
    return NextResponse.json({ success: true, ...result }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al guardar: ${message}` },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
