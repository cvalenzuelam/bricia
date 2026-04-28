/**
 * Lectura de Blobs JSON **sin** usar `list()` del SDK.
 *
 * `list()`, `put()` y `copy()` cuentan como *Advanced operations* en Vercel Blob.
 * Si conoces la URL pública del store (mismo origen para todos los archivos públicos),
 * puedes hacer `fetch` al JSON directamente: no consume advanced ops de listado.
 *
 * Configura en Vercel → Settings → Environment Variables **una** de:
 *   · VERCEL_BLOB_PUBLIC_BASE_URL   (recomendado)
 *   · BLOB_PUBLIC_BASE_URL
 *
 * Valor ejemplo: https://abcdefghijkl.public.blob.vercel-storage.com
 * (sin barra final; la copias del navegador abriendo cualquier archivo del store
 *  o del panel de Blob → URL pública, quitando solo la parte del path del archivo)
 */

function resolveBlobPublicBase(): string | null {
  const raw =
    process.env.VERCEL_BLOB_PUBLIC_BASE_URL?.trim() ||
    process.env.BLOB_PUBLIC_BASE_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

export function blobPublicFileUrl(pathname: string): string | null {
  const base = resolveBlobPublicBase();
  if (!base) return null;
  const path = pathname.replace(/^\/+/, "");
  return `${base}/${path}`;
}

/**
 * Descarga JSON público por pathname fijo (ej. `bricia/products.json`).
 * Devuelve null si no hay BASE configurada, fetch falla o el JSON no es válido.
 */
export async function fetchPublicBlobJson<T>(
  pathname: string,
  fetchTimeoutMs: number
): Promise<T | null> {
  const url = blobPublicFileUrl(pathname);
  if (!url) return null;

  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), fetchTimeoutMs);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: ac.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}
