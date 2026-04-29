import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Carpeta del proyecto y entrada CSS de Tailwind (evita resolver desde la carpeta padre `Web`). */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));
const tailwindcssEntry = path.join(
  turbopackRoot,
  "node_modules",
  "tailwindcss",
  "index.css",
);

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
    resolveAlias: {
      tailwindcss: tailwindcssEntry,
    },
  },
  images: {
    /**
     * Incluye 1920–3840 para que en DPR 2+ no se escale una imagen de ~1200px
     * a un layout mucho más ancho (causa típica de “borrosidad” vs. preview en escritorio).
     */
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 240, 384],
    /** Una sola derivada por petición donde el navegador lo admite vs avif+webp (menos transformations). */
    formats: ["image/webp"],
    /** Reutiliza el mismo archivo optimizado en CDN más tiempo. */
    minimumCacheTTL: 60 * 60 * 24 * 14,
    /** Allowlist para la prop `quality` de next/image (@/lib/image-quality). */
    qualities: [75, 85, 90, 92, 95, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      /** Supabase Storage (paths bajo `/storage/`; omitimos pathname estricto para no romper coincide con `_next/image`) */
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
