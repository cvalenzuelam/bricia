/** URLs públicas en Supabase Storage: el proxy de optimización (`/_next/image`) puede fallar aunque el navegador cargue bien el origen; servirlas sin pasar por el optimizer evita thumbnails rotos en producción. */
export function shouldUnoptimizeRemoteImage(src: string): boolean {
  if (typeof src !== "string" || !src.startsWith("http")) return false;
  return /\.supabase\.co/i.test(src);
}
