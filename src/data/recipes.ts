import fs from "fs";
import path from "path";

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

const DATA_PATH = path.join(process.cwd(), "src/data/recipes.json");

export function getRecipes(): Recipe[] {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return getRecipes().find((r) => r.slug === slug);
}

export function saveRecipes(recipes: Recipe[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(recipes, null, 2), "utf-8");
}

export function addRecipe(recipe: Recipe): void {
  const recipes = getRecipes();
  recipes.push(recipe);
  saveRecipes(recipes);
}

export function updateRecipe(slug: string, updated: Partial<Recipe>): Recipe | null {
  const recipes = getRecipes();
  const index = recipes.findIndex((r) => r.slug === slug);
  if (index === -1) return null;
  recipes[index] = { ...recipes[index], ...updated };
  saveRecipes(recipes);
  return recipes[index];
}

export function deleteRecipe(slug: string): boolean {
  const recipes = getRecipes();
  const filtered = recipes.filter((r) => r.slug !== slug);
  if (filtered.length === recipes.length) return false;
  saveRecipes(filtered);
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
