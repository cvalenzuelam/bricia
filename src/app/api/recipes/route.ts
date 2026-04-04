import { NextRequest, NextResponse } from "next/server";
import { getRecipes, addRecipe, generateSlug } from "@/data/recipes";

export async function GET() {
  try {
    const recipes = getRecipes();
    return NextResponse.json(recipes);
  } catch {
    return NextResponse.json({ error: "Error al cargar recetas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, category, image, history, ingredients, steps, prepTime, servings } = body;

    if (!title || !category) {
      return NextResponse.json({ error: "Título y categoría son obligatorios" }, { status: 400 });
    }

    const slug = generateSlug(title);
    const recipe = {
      slug,
      title,
      subtitle: subtitle || "",
      category: category.toUpperCase(),
      image: image || "/images/placeholder.png",
      history: history || "",
      ingredients: ingredients || [],
      steps: steps || [],
      prepTime: prepTime || "",
      servings: servings || "",
    };

    addRecipe(recipe);
    return NextResponse.json({ success: true, recipe }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear receta" }, { status: 500 });
  }
}
