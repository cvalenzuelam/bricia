import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { reorderRecipes } from "@/data/recipes";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const slugs = body?.slugs;

    if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
      return NextResponse.json(
        { error: "Se requiere un arreglo de slugs" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const recipes = await reorderRecipes(slugs);

    try {
      revalidatePath("/admin");
      revalidatePath("/recetas");
      revalidatePath("/");
    } catch {
      /* no-op */
    }

    return NextResponse.json({ success: true, recipes }, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Error al reordenar recetas" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
