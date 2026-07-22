"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { shouldUnoptimizeRemoteImage } from "@/lib/next-image-remote";
import { PHOTO_IMAGE_QUALITY, HERO_IMAGE_QUALITY } from "@/lib/image-quality";
import ImageFrameFade from "@/components/ImageFrameFade";
import { duration, easeOutExpo } from "@/lib/motion";

type RecipeGalleryProps = {
  title: string;
  /** Imagen hero de la receta (arriba del contenido) */
  heroImage: string;
  /** Fotos del collage (hasta 4) */
  gallery?: string[];
  /** Contenido entre la foto principal y el collage (video, historia, etc.) */
  children?: ReactNode;
};

export default function RecipeGallery({
  title,
  heroImage,
  gallery = [],
  children,
}: RecipeGalleryProps) {
  const gallerySlice = gallery.slice(0, 4);
  const allImages = [heroImage, ...gallerySlice.filter((src) => src !== heroImage)];

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;
  const activeSrc = isOpen ? allImages[openIndex] : null;

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrev = useCallback(() => {
    setOpenIndex((i) =>
      i === null ? null : (i - 1 + allImages.length) % allImages.length
    );
  }, [allImages.length]);
  const showNext = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % allImages.length));
  }, [allImages.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close, showPrev, showNext]);

  const openAtSrc = (src: string) => {
    const idx = allImages.indexOf(src);
    setOpenIndex(idx >= 0 ? idx : 0);
  };

  return (
    <>
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 mb-24">
        <button
          type="button"
          onClick={() => openAtSrc(heroImage)}
          className="group relative block w-full aspect-[4/5] md:aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-4 focus-visible:ring-offset-brand-secondary"
          aria-label={`Ver ${title} en grande`}
        >
          <Image
            src={heroImage}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 80vw"
            quality={PHOTO_IMAGE_QUALITY}
            unoptimized={shouldUnoptimizeRemoteImage(heroImage)}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            priority
          />
          <ImageFrameFade variant="cream" />
          <span className="pointer-events-none absolute inset-0 z-[2] bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
          <span className="pointer-events-none absolute bottom-4 right-4 z-[3] rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-sans font-bold tracking-[0.2em] uppercase text-brand-primary/70 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-400 group-hover:opacity-100">
            Ver en grande
          </span>
        </button>
      </div>

      {children}

      {/* Collage */}
      {gallerySlice.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mt-32 mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-6 md:h-[800px]">
            {gallerySlice.map((img, i) => {
              let layoutClasses = "";
              if (i === 0)
                layoutClasses =
                  "col-span-2 md:col-span-2 md:row-span-2 h-[400px] md:h-auto";
              else if (i === 1)
                layoutClasses =
                  "col-span-2 md:col-span-2 md:row-span-1 h-[300px] md:h-auto";
              else
                layoutClasses =
                  "col-span-1 md:col-span-1 md:row-span-1 aspect-square md:aspect-auto md:h-auto";

              return (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => openAtSrc(img)}
                  className={`relative rounded-3xl overflow-hidden shadow-2xl group cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary ${layoutClasses}`}
                  aria-label={`Ver foto ${i + 1} de ${title} en grande`}
                >
                  <Image
                    src={img}
                    alt={`${title} galería ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 35vw"
                    quality={PHOTO_IMAGE_QUALITY}
                    unoptimized={shouldUnoptimizeRemoteImage(img)}
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <ImageFrameFade variant="cream" />
                  <span className="pointer-events-none absolute inset-0 z-[2] bg-black/0 transition-colors duration-500 group-hover:bg-black/15" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {isOpen && activeSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast }}
            className="fixed inset-0 z-[80] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label={`Vista ampliada: ${title}`}
          >
            <button
              type="button"
              className="absolute inset-0 bg-brand-primary/85 backdrop-blur-md"
              onClick={close}
              aria-label="Cerrar vista ampliada"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: duration.base, ease: easeOutExpo }}
              className="relative z-10 mx-4 flex w-full max-w-6xl flex-col items-center"
            >
              <div className="relative w-full overflow-hidden rounded-2xl bg-brand-secondary/5 shadow-2xl">
                <div className="relative mx-auto aspect-[4/5] max-h-[min(82svh,900px)] w-full sm:aspect-[16/10]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSrc}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={activeSrc}
                        alt={`${title} — vista ampliada`}
                        fill
                        sizes="100vw"
                        quality={HERO_IMAGE_QUALITY}
                        unoptimized={shouldUnoptimizeRemoteImage(activeSrc)}
                        className="object-contain"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-5 flex w-full items-center justify-between gap-4 px-1">
                <p className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-white/55">
                  {(openIndex ?? 0) + 1} / {allImages.length}
                </p>
                <div className="flex items-center gap-2">
                  {allImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPrev}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft size={20} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={showNext}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"
                        aria-label="Foto siguiente"
                      >
                        <ChevronRight size={20} strokeWidth={1.5} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={close}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"
                    aria-label="Cerrar"
                  >
                    <X size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
