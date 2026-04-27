"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Play, X, ExternalLink } from "lucide-react";
import { getVideoEmbedInfo } from "@/lib/video-embed";

interface RecipeVideoBlockProps {
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
}

export default function RecipeVideoBlock({
  videoUrl,
  thumbnailUrl,
  title,
}: RecipeVideoBlockProps) {
  const [open, setOpen] = useState(false);
  const info = getVideoEmbedInfo(videoUrl);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!videoUrl.trim() || !info) return null;

  const openPlayer = () => {
    if (info.kind === "external") {
      window.open(info.href || info.src, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <section className="max-w-3xl mx-auto px-6 mb-24">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="editorial-spacing border-b border-brand-accent/30 pb-4 inline-block">
            EN VIDEO
          </h2>
        </div>

        <div className="relative rounded-[2rem] overflow-hidden border border-brand-primary/10 shadow-[0_12px_40px_rgb(0,0,0,0.06)] bg-white/70 backdrop-blur-sm">
          <button
            type="button"
            onClick={openPlayer}
            className="group relative block w-full text-left aspect-video focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary"
            aria-label="Ver video de la receta"
          >
            <Image
              src={thumbnailUrl}
              alt={`Video — ${title}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 48rem"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-brand-primary shadow-lg transition-transform duration-300 group-hover:scale-110">
                <Play size={28} className="ml-1" fill="currentColor" />
              </span>
              <span className="text-xs font-sans font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
                Ver video
              </span>
            </div>
          </button>

          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-brand-primary/5 bg-brand-secondary/40">
            <p className="text-sm font-serif text-brand-primary/80 italic">
              Mira el paso a paso en video.
            </p>
            {info.kind === "external" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider text-brand-muted">
                <ExternalLink size={12} /> Se abre en nueva pestaña
              </span>
            )}
          </div>
        </div>
      </section>

      {open && info.kind !== "external" && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="Reproductor de video"
          onClick={close}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Cerrar video"
            >
              <X size={20} />
            </button>

            <div className="aspect-video w-full">
              {info.kind === "youtube" || info.kind === "vimeo" ? (
                <iframe
                  src={info.src}
                  title={`Video — ${title}`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={info.src}
                  controls
                  playsInline
                  className="h-full w-full"
                  preload="metadata"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
