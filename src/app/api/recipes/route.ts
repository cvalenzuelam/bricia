import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getRecipes, addRecipe, generateSlug } from "@/data/recipes";

// Permitimos que la CDN cachee 60s y sirva stale hasta 5 min mientras
// revalida en segundo plano. Esto reduce drásticamente las llamadas a
// Vercel Blob (cada `list()` cuenta como Advanced Request).
const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

/** `?sync=` / `?nocache=` evita CDN/HTML cache en los polls del CMS (listado debe coincidir al guardado). */
export async function GET(request: NextRequest) {
  const noCache =
    request.nextUrl.searchParams.has("sync") ||
    request.nextUrl.searchParams.has("nocache");

  try {
    const recipes = await getRecipes();
    return NextResponse.json(recipes, {
      headers: noCache ? NO_STORE_HEADERS : PUBLIC_CACHE_HEADERS,
    });
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
    try {
      revalidatePath("/admin");
      revalidatePath("/recetas");
      revalidatePath(`/recetas/${recipe.slug}`);
      revalidatePath("/");
    } catch {
      /* no-op */
    }
    return NextResponse.json({ success: true, recipe }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear receta" },
      { status: 500 }
    );
  }
}
