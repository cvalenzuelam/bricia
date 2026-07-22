"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { PHOTO_IMAGE_QUALITY } from "@/lib/image-quality";
import ImageFrameFade from "@/components/ImageFrameFade";
import ImageLightbox from "@/components/ImageLightbox";

export default function ProductImageGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const safe = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setActive(0);
    setLightboxIndex(null);
  }, [images.join("|")]);

  const setIdx = useCallback(
    (i: number) => {
      setActive((prev) => (i >= 0 && i < safe.length ? i : prev));
    },
    [safe.length]
  );

  const openLightbox = useCallback(
    (i: number) => {
      if (i >= 0 && i < safe.length) setLightboxIndex(i);
    },
    [safe.length]
  );

  if (safe.length === 0) {
    return (
      <div className="relative aspect-[4/5] rounded-2xl bg-white border border-brand-primary/5 shadow-sm flex items-center justify-center text-sm font-sans text-brand-muted">
        Sin imagen
      </div>
    );
  }

  const mainSrc = safe[active] ?? safe[0];

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => openLightbox(active)}
          className="group relative block w-full aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-brand-primary/5 shadow-sm cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary"
          aria-label={`Ver ${productName} en grande`}
        >
          <Image
            src={mainSrc}
            alt={
              safe.length > 1
                ? `${productName} — foto ${active + 1} de ${safe.length}`
                : productName
            }
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            quality={PHOTO_IMAGE_QUALITY}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            priority={active === 0}
          />
          <ImageFrameFade variant="white" />
          <span className="pointer-events-none absolute inset-0 z-[2] bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
          <span className="pointer-events-none absolute bottom-4 right-4 z-[3] rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-sans font-bold tracking-[0.2em] uppercase text-brand-primary/70 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-400 group-hover:opacity-100">
            Ver en grande
          </span>
        </button>

        {safe.length > 1 && (
          <div
            className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 no-scrollbar"
            role="tablist"
            aria-label="Más fotos del producto"
          >
            {safe.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                role="tab"
                aria-selected={active === i}
                onClick={() => setIdx(i)}
                onDoubleClick={() => openLightbox(i)}
                className={`relative h-[5.25rem] w-16 sm:h-28 sm:w-[4.5rem] shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  active === i
                    ? "border-brand-accent shadow-sm ring-1 ring-brand-accent/25 scale-[1.02]"
                    : "border-brand-primary/10 opacity-80 hover:opacity-100 hover:border-brand-accent/45 hover:scale-[1.03] hover:shadow-md"
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 64px, 72px"
                  quality={PHOTO_IMAGE_QUALITY}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <ImageLightbox
        images={safe}
        alt={productName}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />
    </>
  );
}
