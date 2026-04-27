"use client";

import { upload } from "@vercel/blob/client";

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "[::1]"
  );
}

/**
 * Sube imagen desde el CMS: en localhost sin token Blob usa `/api/upload`
 * (disco en dev); en producción usa upload directo a Vercel Blob.
 */
export async function uploadCmsImageFile(
  file: File,
  blobPathname: string
): Promise<string | null> {
  if (isLocalDevHost()) {
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

  const blob = await upload(blobPathname, file, {
    access: "public",
    handleUploadUrl: "/api/upload/client",
    multipart: true,
    contentType: file.type || "image/jpeg",
  });
  return blob.url;
}
