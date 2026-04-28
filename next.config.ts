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
    /** Menos regeneraciones nuevas ante muchos tamaños viewport (presupuesto Hobby Image Optimization). */
    deviceSizes: [640, 750, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 240, 384],
    /** Una sola derivada por petición donde el navegador lo admite vs avif+webp (menos transformations). */
    formats: ["image/webp"],
    /** Reutiliza el mismo archivo optimizado en CDN más tiempo. */
    minimumCacheTTL: 60 * 60 * 24 * 14,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
