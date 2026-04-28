import type { Recipe } from "@/data/recipes";
import type { MesaArticle } from "@/data/lamesa";
import type { Product } from "@/data/products";

export type SiteSearchKind = "recipe" | "mesa" | "product";

export interface SiteSearchHit {
  kind: SiteSearchKind;
  href: string;
  title: string;
  subtitle: string;
  image: string;
  badge: string;
  score: number;
}

/** Minúsculas + sin acentos (limón → limon) para coincidencias humanas. */
export function normalizeSearchText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tokensFromQuery(q: string): string[] {
  return normalizeSearchText(q)
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/** Todas las palabras deben aparecer en algún sitio del texto agregado. */
function matchesAllTokens(blob: string, tokens: string[]): boolean {
  const h = normalizeSearchText(blob);
  return tokens.every((t) => h.includes(t));
}

function excerptLine(text: string, max = 90): string {
  const t = text?.trim() || "";
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

/**
 * Búsqueda consciente del sitio: recetas (título, subtítulo, categoría,
 * ingredientes, historia), artículos La Mesa, productos de tienda.
 */
export function searchSite(
  query: string,
  recipes: Recipe[],
  articles: MesaArticle[],
  products: Product[]
): SiteSearchHit[] {
  const compact = normalizeSearchText(query).replace(/\s/g, "");
  if (compact.length < 2) return [];

  const tokens = tokensFromQuery(query);
  if (tokens.length === 0) return [];

  const hits: SiteSearchHit[] = [];
  const queryNorm = normalizeSearchText(query);

  for (const r of recipes) {
    const ingredientBlob = (r.ingredients || []).join(" ");
    const blob = [
      r.title,
      r.subtitle,
      r.category,
      ingredientBlob,
      r.history,
      r.prepTime,
      r.servings,
    ].join(" ");
    if (!matchesAllTokens(blob, tokens)) continue;

    let score = 0;
    const bump = (text: string, w: number) => {
      const nt = normalizeSearchText(text);
      for (const t of tokens) {
        if (nt.includes(t)) score += w;
      }
    };
    bump(r.title, 14);
    bump(r.subtitle, 7);
    bump(r.category, 6);
    bump(ingredientBlob, 5);
    bump(r.history, 2);

    if (queryNorm.length >= 2 && normalizeSearchText(r.title).includes(queryNorm)) {
      score += 28;
    }

    hits.push({
      kind: "recipe",
      href: `/recetas/${r.slug}`,
      title: r.title,
      subtitle: r.subtitle?.trim() || r.category,
      image: r.image,
      badge: `Receta · ${r.category}`,
      score,
    });
  }

  for (const a of articles) {
    const blob = [a.title, a.excerpt, a.type, a.readingTime, a.date].join(" ");
    if (!matchesAllTokens(blob, tokens)) continue;

    let score = 0;
    const bump = (text: string, w: number) => {
      const nt = normalizeSearchText(text);
      for (const t of tokens) {
        if (nt.includes(t)) score += w;
      }
    };
    bump(a.title, 14);
    bump(a.excerpt, 6);
    bump(a.type, 5);
    bump(a.readingTime, 1);

    if (queryNorm.length >= 2 && normalizeSearchText(a.title).includes(queryNorm)) {
      score += 28;
    }

    hits.push({
      kind: "mesa",
      href: `/la-mesa/${a.slug}`,
      title: a.title,
      subtitle: excerptLine(a.excerpt, 100),
      image: a.coverImage,
      badge: `La mesa · ${a.type}`,
      score,
    });
  }

  for (const p of products) {
    const blob = [p.name, p.subtitle, p.category, p.description].join(" ");
    if (!matchesAllTokens(blob, tokens)) continue;

    let score = 0;
    const bump = (text: string, w: number) => {
      const nt = normalizeSearchText(text);
      for (const t of tokens) {
        if (nt.includes(t)) score += w;
      }
    };
    bump(p.name, 12);
    bump(p.subtitle, 6);
    bump(p.category, 5);
    bump(p.description, 2);

    if (queryNorm.length >= 2 && normalizeSearchText(p.name).includes(queryNorm)) {
      score += 24;
    }

    hits.push({
      kind: "product",
      href: `/productos/${p.id}`,
      title: p.name,
      subtitle: p.subtitle?.trim() || p.category,
      image: p.image,
      badge: `Tienda · ${p.category}`,
      score,
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits;
}

/** Sugerencias editoriales mezcladas cuando aún no hay consulta. */
export function mixedSuggestions(
  recipes: Recipe[],
  articles: MesaArticle[],
  products: Product[],
  limit = 6
): SiteSearchHit[] {
  const recipeHit = (x: Recipe): SiteSearchHit => ({
    kind: "recipe",
    href: `/recetas/${x.slug}`,
    title: x.title,
    subtitle: x.subtitle?.trim() || x.category,
    image: x.image,
    badge: `Receta · ${x.category}`,
    score: 0,
  });
  const mesaHit = (x: MesaArticle): SiteSearchHit => ({
    kind: "mesa",
    href: `/la-mesa/${x.slug}`,
    title: x.title,
    subtitle: excerptLine(x.excerpt, 72),
    image: x.coverImage,
    badge: `La mesa · ${x.type}`,
    score: 0,
  });
  const productHit = (x: Product): SiteSearchHit => ({
    kind: "product",
    href: `/productos/${x.id}`,
    title: x.name,
    subtitle: x.subtitle?.trim() || x.category,
    image: x.image,
    badge: `Tienda · ${x.category}`,
    score: 0,
  });

  const out: SiteSearchHit[] = [];
  let ri = 0;
  let ai = 0;
  let pi = 0;
  const pattern: Array<"r" | "m" | "p"> = ["r", "m", "r", "p", "m", "r", "p", "m"];

  for (const slot of pattern) {
    if (out.length >= limit) break;
    if (slot === "r" && ri < recipes.length) out.push(recipeHit(recipes[ri++]));
    else if (slot === "m" && ai < articles.length) out.push(mesaHit(articles[ai++]));
    else if (slot === "p" && pi < products.length) out.push(productHit(products[pi++]));
  }

  while (out.length < limit) {
    if (ri < recipes.length) {
      out.push(recipeHit(recipes[ri++]));
      continue;
    }
    if (ai < articles.length) {
      out.push(mesaHit(articles[ai++]));
      continue;
    }
    if (pi < products.length) {
      out.push(productHit(products[pi++]));
      continue;
    }
    break;
  }

  return out.slice(0, limit);
}
