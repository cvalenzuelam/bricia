"use client";

/**
 * Sube una imagen del CMS mediante POST a `/api/upload`.
 * El servidor elige disco (local), Supabase Storage o Blob según configuración.
 */
export async function uploadCmsImageFile(
  file: File,
  _blobPathname?: string
): Promise<string | null> {
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
