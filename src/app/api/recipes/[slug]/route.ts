import { NextRequest, NextResponse } from "next/server";
import { updateRecipe, deleteRecipe, getRecipeBySlug } from "@/data/recipes";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) {
    return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
  }
  return NextResponse.json(recipe);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const updated = updateRecipe(slug, body);
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
  const deleted = deleteRecipe(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
