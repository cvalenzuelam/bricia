import { readFile, writeFile } from "fs/promises";
import path from "path";
import localRecipesData from "./recipes.json";
import { MemoryCache } from "@/lib/memory-cache";
import { localJsonInDev } from "@/lib/dev-data-source";
import { CMS_DOC_KEYS, fetchCmsDocument, upsertCmsDocument } from "@/lib/supabase/cms-documents";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export interface Recipe {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  history: string;
  gallery?: string[];
  videoUrl?: string;
  videoThumbnail?: string;
  ingredients: string[];
  steps: string[];
  prepTime: string;
  servings: string;
}

const LOCAL_RECIPES_PATH = path.join(process.cwd(), "src/data/recipes.json");
const FETCH_TIMEOUT_MS = 10000;
const SAVE_TIMEOUT_MS = 15000;

function shouldPersistRecipesLocally(): boolean {
  return localJsonInDev();
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout while ${label} after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/** Solo para modo sin Supabase (JSON empaquetado); con Supabase no cacheamos en proceso — evita vistas viejas entre instancias serverless durante minutos */
const bundledRecipesFallbackCache = new MemoryCache<Recipe[]>(60_000);

export async function getRecipes(): Promise<Recipe[]> {
  if (shouldPersistRecipesLocally()) {
    try {
      const raw = await readFile(LOCAL_RECIPES_PATH, "utf-8");
      return JSON.parse(raw) as Recipe[];
    } catch {
      return localRecipesData as Recipe[];
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const remote = await withTimeout(
        fetchCmsDocument<Recipe[]>(CMS_DOC_KEYS.recipes),
        FETCH_TIMEOUT_MS,
        "reading recipes from Supabase"
      );
      if (Array.isArray(remote)) {
        return remote;
      }
    } catch (e) {
      console.error("[recipes] Supabase read failed:", e);
    }
  }

  const cached = bundledRecipesFallbackCache.get();
  if (cached) return cached;

  const fallback = localRecipesData as Recipe[];
  bundledRecipesFallbackCache.set(fallback);
  return fallback;
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | undefined> {
  const recipes = await getRecipes();
  return recipes.find((r) => r.slug === slug);
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  const payload = JSON.stringify(recipes, null, 2);

  if (shouldPersistRecipesLocally()) {
    await writeFile(LOCAL_RECIPES_PATH, payload, "utf-8");
    return;
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Configura Supabase (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) para guardar recetas."
    );
  }

  await withTimeout(
    upsertCmsDocument(CMS_DOC_KEYS.recipes, recipes),
    SAVE_TIMEOUT_MS,
    "saving recipes to Supabase"
  );
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
