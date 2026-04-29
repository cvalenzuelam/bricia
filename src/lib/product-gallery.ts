import type { Product } from "@/data/products";

export const PRODUCT_GALLERY_MAX = 3;

/** Normaliza lista de URLs para galería (máx. 3, sin vacíos). */
export function normalizeProductGallery(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, PRODUCT_GALLERY_MAX);
}

/** Imágenes en orden: principal + extras únicas. */
export function productAllImageUrls(product: Product): string[] {
  const main = product.image?.trim();
  const extras = normalizeProductGallery(product.gallery);
  const out: string[] = [];
  if (main) out.push(main);
  for (const u of extras) {
    if (u !== main && !out.includes(u)) out.push(u);
  }
  return out;
}
