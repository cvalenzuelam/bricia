"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { PHOTO_IMAGE_QUALITY } from "@/lib/image-quality";
import ImageFrameFade from "@/components/ImageFrameFade";

export default function ProductImageGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const safe = images.filter(Boolean);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [images.join("|")]);

  const setIdx = useCallback((i: number) => {
    setActive((prev) => (i >= 0 && i < safe.length ? i : prev));
  }, [safe.length]);

  if (safe.length === 0) {
    return (
      <div className="relative aspect-[4/5] rounded-2xl bg-white border border-brand-primary/5 shadow-sm flex items-center justify-center text-sm font-sans text-brand-muted">
        Sin imagen
      </div>
    );
  }

  const mainSrc = safe[active] ?? safe[0];

  if (safe.length === 1) {
    return (
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-brand-primary/5 shadow-sm">
        <Image
          src={safe[0]}
          alt={productName}
          fill
          sizes="(max-width: 1024px) 100vw, 58vw"
          quality={PHOTO_IMAGE_QUALITY}
          className="object-cover"
          priority
        />
        <ImageFrameFade variant="white" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-brand-primary/5 shadow-sm">
        <Image
          src={mainSrc}
          alt={`${productName} — foto ${active + 1} de ${safe.length}`}
          fill
          sizes="(max-width: 1024px) 100vw, 58vw"
          quality={PHOTO_IMAGE_QUALITY}
          className="object-cover"
          priority={active === 0}
        />
        <ImageFrameFade variant="white" />
      </div>
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
            className={`relative h-[5.25rem] w-16 sm:h-28 sm:w-[4.5rem] shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
              active === i
                ? "border-brand-accent shadow-sm ring-1 ring-brand-accent/25"
                : "border-brand-primary/10 opacity-85 hover:opacity-100"
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
    </div>
  );
}
