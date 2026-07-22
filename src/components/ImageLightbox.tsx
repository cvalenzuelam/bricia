"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { shouldUnoptimizeRemoteImage } from "@/lib/next-image-remote";
import { HERO_IMAGE_QUALITY } from "@/lib/image-quality";
import { duration, easeOutExpo } from "@/lib/motion";

type ImageLightboxProps = {
  images: string[];
  alt: string;
  /** Índice abierto; `null` = cerrado */
  openIndex: number | null;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
};

export default function ImageLightbox({
  images,
  alt,
  openIndex,
  onClose,
  onChangeIndex,
}: ImageLightboxProps) {
  const isOpen = openIndex !== null && images.length > 0;
  const activeSrc = isOpen ? images[openIndex!] : null;
  const count = images.length;

  const showPrev = useCallback(() => {
    if (openIndex === null || count === 0) return;
    onChangeIndex((openIndex - 1 + count) % count);
  }, [openIndex, count, onChangeIndex]);

  const showNext = useCallback(() => {
    if (openIndex === null || count === 0) return;
    onChangeIndex((openIndex + 1) % count);
  }, [openIndex, count, onChangeIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
  }, [isOpen, onClose, showPrev, showNext]);

  return (
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
          aria-label={`Vista ampliada: ${alt}`}
        >
          <button
            type="button"
            className="absolute inset-0 bg-brand-primary/85 backdrop-blur-md"
            onClick={onClose}
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
                      alt={`${alt} — vista ampliada`}
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
                {(openIndex ?? 0) + 1} / {count}
              </p>
              <div className="flex items-center gap-2">
                {count > 1 && (
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
                  onClick={onClose}
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
  );
}
