import { put, list } from "@vercel/blob";
import localRecipesData from "./recipes.json";

export interface Recipe {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  history: string;
  gallery?: string[];
  ingredients: string[];
  steps: string[];
  prepTime: string;
  servings: string;
}

const BLOB_KEY = "bricia/recipes.json";

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    if (blobs.length > 0) {
      // Sort desc to get the most recent one
      const latest = blobs.sort((a, b) =>
        b.uploadedAt > a.uploadedAt ? 1 : -1
      )[0];
      const res = await fetch(latest.url, { cache: "no-store" });
      return (await res.json()) as Recipe[];
    }
    // First run: fall back to the bundled static JSON
    return localRecipesData as Recipe[];
  } catch {
    return localRecipesData as Recipe[];
  }
}

export async function getRecipeBySlug(
  slug: string
): Promise<Recipe | undefined> {
  const recipes = await getRecipes();
  return recipes.find((r) => r.slug === slug);
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(recipes, null, 2), {
    access: "public",
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function addRecipe(recipe: Recipe): Promise<void> {
  const recipes = await getRecipes();
  recipes.push(recipe);
  await saveRecipes(recipes);
}

export async function updateRecipe(
  slug: string,
  updated: Partial<Recipe>
): Promise<Recipe | null> {
  const recipes = await getRecipes();
  const index = recipes.findIndex((r) => r.slug === slug);
  if (index === -1) return null;
  recipes[index] = { ...recipes[index], ...updated };
  await saveRecipes(recipes);
  return recipes[index];
}

export async function deleteRecipe(slug: string): Promise<boolean> {
  const recipes = await getRecipes();
  const filtered = recipes.filter((r) => r.slug !== slug);
  if (filtered.length === recipes.length) return false;
  await saveRecipes(filtered);
  return true;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
