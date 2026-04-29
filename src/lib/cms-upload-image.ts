"use client";

import { createClient } from "@supabase/supabase-js";

function isLocalDevUploadHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]";
}

const DEFAULT_BUCKET =
  typeof process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET.trim() !== ""
    ? process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET.trim()
    : "cms";

let anonClient: ReturnType<typeof createClient> | null = null;

function getBrowserSupabase() {
  const url =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
      : "";
  /** Clave publishable (anon legacy). No es la service_role. */
  const key =
    (typeof process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === "string"
      ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.trim()
      : "") ||
    (typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string"
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()
      : "");

  if (!url || !key) return null;

  if (!anonClient) {
    anonClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonClient;
}

/**
 * Sube imagen desde el CMS:
 * - Desarrollo local: POST `/api/upload` guarda en disco (sin tamaño bloqueante de Vercel).
 * - Producción: firma ligera `/api/upload/sign` + upload directo a Supabase (~sin límite 4 MB de la función Next).
 */
export async function uploadCmsImageFile(
  file: File,
  _blobPathname?: string
): Promise<string | null> {
  /** Desarrollo: mismo proceso que antes (multipart solo en tu máquina). */
  if (isLocalDevUploadHost()) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Error al subir imagen");
      return null;
    }
    return (data?.path as string | undefined) ?? null;
  }

  const sb = getBrowserSupabase();
  if (!sb) {
    alert(
      "Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o ANON legacy) junto a NEXT_PUBLIC_SUPABASE_URL para subidas en producción."
    );
    return null;
  }

  const signRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mime: file.type || "image/jpeg",
      size: file.size,
      name: file.name || "upload.jpg",
    }),
  });

  const signPayload = await signRes.json();
  if (!signRes.ok) {
    alert(signPayload?.error || "No se pudo preparar la subida");
    return null;
  }

  const bucket = typeof signPayload.bucket === "string" ? signPayload.bucket : DEFAULT_BUCKET;
  const token = signPayload.token as string;
  const path = signPayload.path as string;
  const publicUrl = signPayload.publicUrl as string | undefined;

  const { error: upErr } = await sb.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type || "image/jpeg",
    });

  if (upErr) {
    alert(upErr.message || "Error al subir a Storage");
    return null;
  }

  return typeof publicUrl === "string" && publicUrl.length > 0
    ? publicUrl
    : null;
}
