/**
 * Dónde cargar catálogos JSON en desarrollo.
 *
 * En `next dev` en tu PC (sin variables de Vercel `VERCEL`),
 * por defecto usamos archivos en `src/data/*.json` para no consumir
 * operaciones avanzadas de Vercel Blob mientras programas.
 *
 * Si necesitas leer/escribir el Blob real desde local, en `.env.local`:
 *   USE_BLOB_IN_DEV=true
 */

export function localJsonInDev(): boolean {
  if (Boolean(process.env.VERCEL)) return false;
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.USE_BLOB_IN_DEV === "true") return false;
  return true;
}
