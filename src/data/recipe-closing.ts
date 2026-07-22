export const DEFAULT_RECIPE_CLOSING_PHRASE = "Donde el tiempo se sienta a la mesa.";

/** Frases por slug para recetas ya publicadas (fallback si el CMS aún no tiene el campo). */
const CLOSING_PHRASE_BY_SLUG: Record<string, string> = {
  "tiradito-atun-salsa-serrano": "El limón despierta lo que el mar ya sabía.",
  "ensalada-primavera-fresas": "La primavera llega primero a la ensaladera.",
  "gazpacho-verano-fresco": "El verano, frío y rojo, en una cuchara.",
  "volcan-chocolate-decadente": "Un corazón que se derrite al primer corte.",
  "sopa-calabaza-semillas": "El otoño se sirve caliente y en silencio.",
  "estofado-res-invierno": "Donde el fuego lento se vuelve abrazo.",
};

export function resolveRecipeClosingPhrase(recipe: {
  slug: string;
  closingPhrase?: string;
}): string {
  const custom = recipe.closingPhrase?.trim();
  if (custom) return custom;
  return CLOSING_PHRASE_BY_SLUG[recipe.slug] || DEFAULT_RECIPE_CLOSING_PHRASE;
}
