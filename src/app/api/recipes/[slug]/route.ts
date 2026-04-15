import { NextRequest, NextResponse } from "next/server";
import { updateRecipe, deleteRecipe, getRecipeBySlug } from "@/data/recipes";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) {
    return NextResponse.json(
      { error: "Receta no encontrada" },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }
  return NextResponse.json(recipe, { headers: NO_STORE_HEADERS });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const updated = await updateRecipe(slug, body);
    if (!updated) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true, recipe: updated });
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const deleted = await deleteRecipe(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
