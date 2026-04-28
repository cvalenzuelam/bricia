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
