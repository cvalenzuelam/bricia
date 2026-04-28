import { readFile, writeFile } from "fs/promises";
import path from "path";
import { put, list } from "@vercel/blob";
import localRecipesData from "./recipes.json";
import { MemoryCache } from "@/lib/memory-cache";
import { fetchPublicBlobJson } from "@/lib/blob-public-read";
import { localJsonInDev } from "@/lib/dev-data-source";

export interface Recipe {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  history: string;
  gallery?: string[];
  /** Instagram (reel/post), YouTube, Vimeo, .mp4/.webm u otra URL https */
  videoUrl?: string;
  /** Miniatura del video (si no hay, se usa la foto principal de la receta) */
  videoThumbnail?: string;
  ingredients: string[];
  steps: string[];
  prepTime: string;
  servings: string;
}

const BLOB_KEY = "bricia/recipes.json";
const LOCAL_RECIPES_PATH = path.join(process.cwd(), "src/data/recipes.json");
const LIST_TIMEOUT_MS = 10000;
const FETCH_TIMEOUT_MS = 10000;
const SAVE_TIMEOUT_MS = 15000;

const BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.BLOB_TOKEN ||
  process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

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

const recipesCache = new MemoryCache<Recipe[]>(300_000);

export async function getRecipes(): Promise<Recipe[]> {
  if (shouldPersistRecipesLocally()) {
    try {
      const raw = await readFile(LOCAL_RECIPES_PATH, "utf-8");
      return JSON.parse(raw) as Recipe[];
    } catch {
      return localRecipesData as Recipe[];
    }
  }

  const cached = recipesCache.get();
  if (cached) return cached;

  const viaPublic = await fetchPublicBlobJson<Recipe[]>(
    BLOB_KEY,
    FETCH_TIMEOUT_MS
  );
  if (viaPublic && Array.isArray(viaPublic)) {
    recipesCache.set(viaPublic);
    return viaPublic;
  }

  try {
    const { blobs } = await withTimeout(
      list({
        prefix: BLOB_KEY,
        ...(BLOB_TOKEN ? { token: BLOB_TOKEN } : {}),
      }),
      LIST_TIMEOUT_MS,
      "listing recipe blobs"
    );
    if (blobs.length > 0) {
      // Sort desc to get the most recent one
      const latest = blobs.sort((a, b) =>
        b.uploadedAt > a.uploadedAt ? 1 : -1
      )[0];
      const res = await withTimeout(
        fetch(latest.url, { cache: "no-store" }),
        FETCH_TIMEOUT_MS,
        "fetching latest recipes blob"
      );
      const data = (await res.json()) as Recipe[];
      recipesCache.set(data);
      return data;
    }
    // First run: fall back to the bundled static JSON
    const fallback = localRecipesData as Recipe[];
    recipesCache.set(fallback);
    return fallback;
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
  const payload = JSON.stringify(recipes, null, 2);

  if (shouldPersistRecipesLocally()) {
    await writeFile(LOCAL_RECIPES_PATH, payload, "utf-8");
    return;
  }

  if (!BLOB_TOKEN) {
    throw new Error(
      "Falta BLOB_READ_WRITE_TOKEN para guardar recetas. En desarrollo local sin token se usa src/data/recipes.json."
    );
  }

  await withTimeout(
    put(BLOB_KEY, payload, {
      access: "public",
      allowOverwrite: true,
      contentType: "application/json",
      token: BLOB_TOKEN,
    }),
    SAVE_TIMEOUT_MS,
    "saving recipes blob"
  );
  recipesCache.set(recipes);
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
