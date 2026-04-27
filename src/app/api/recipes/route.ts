import { NextRequest, NextResponse } from "next/server";
import { getRecipes, addRecipe, generateSlug } from "@/data/recipes";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function GET() {
  try {
    const recipes = await getRecipes();
    return NextResponse.json(recipes, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Error al cargar recetas" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      subtitle,
      category,
      image,
      history,
      gallery,
      videoUrl,
      ingredients,
      steps,
      prepTime,
      servings,
    } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: "Título y categoría son obligatorios" },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);
    const recipe = {
      slug,
      title,
      subtitle: subtitle || "",
      category: category.toUpperCase(),
      image: image || "/images/placeholder.png",
      history: history || "",
      gallery: Array.isArray(gallery) ? gallery : [],
      ...(typeof videoUrl === "string" && videoUrl.trim()
        ? { videoUrl: videoUrl.trim() }
        : {}),
      ingredients: ingredients || [],
      steps: steps || [],
      prepTime: prepTime || "",
      servings: servings || "",
    };

    await addRecipe(recipe);
    return NextResponse.json({ success: true, recipe }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear receta" },
      { status: 500 }
    );
  }
}
