"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { PHOTO_IMAGE_QUALITY } from "@/lib/image-quality";
import ImageFrameFade from "@/components/ImageFrameFade";

const DEFAULT_INSTAGRAM_PROFILE_HREF =
  "https://www.instagram.com/briciaelizalde/";

/** Hasta 10 fotos en desktop (5×2); solo 6 visibles en viewports &lt;1024px. */
const COMMUNITY_GRID_MAX = 10;
const COMMUNITY_MOBILE_VISIBLE = 6;

/** URL de destino: vacío → perfil IG; /ruta → interna; http(s) → externa. */
function resolveCommunityImageHref(raw: string | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return DEFAULT_INSTAGRAM_PROFILE_HREF;
  const lower = t.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return DEFAULT_INSTAGRAM_PROFILE_HREF;
  }
  if (t.startsWith("/")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("www.")) return `https://${t}`;
  return t;
}

function isInternalCommunityHref(href: string): boolean {
  return href.startsWith("/");
}

interface Config {
  instagramImages: {
    src: string;
    caption?: string;
    isVideo?: boolean;
    href?: string;
  }[];
}

const communityTileClass =
  "group relative block aspect-square overflow-hidden rounded-xl bg-brand-primary/[0.04] ring-1 ring-black/[0.04] shadow-[0_2px_16px_-6px_rgba(29,29,27,0.09)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:z-20 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-12px_rgba(29,29,27,0.16)] sm:rounded-2xl md:rounded-3xl";

function CommunityBridge() {
  return (
    <div className="relative z-[1] w-full px-4" aria-hidden>
      <svg
        className="mx-auto block h-10 w-[min(72rem,100%)] text-brand-accent/[0.09] md:h-14"
        viewBox="0 0 1200 48"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="currentColor"
          d="M0 40c200-18 400-18 600 0s400 18 600 0V48H0V40z"
        />
      </svg>
      <div className="-mt-6 flex items-center justify-center gap-5 md:-mt-8 md:gap-8">
        <span className="h-px w-[min(7rem,22vw)] bg-gradient-to-r from-transparent to-brand-accent/35 md:w-32" />
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-accent/20 bg-brand-secondary/90 shadow-[0_1px_0_rgba(29,29,27,0.04)]">
          <span className="block h-2 w-2 rotate-45 bg-brand-accent/55" />
        </span>
        <span className="h-px w-[min(7rem,22vw)] bg-gradient-to-l from-transparent to-brand-accent/35 md:w-32" />
      </div>
    </div>
  );
}

export default function InstagramFeed({
  initialInstagramImages,
  /** true cuando el home SSR ya cargó instagramImages desde hero */
  fromServer = false,
}: {
  initialInstagramImages?: { src: string; caption?: string; isVideo?: boolean }[];
  fromServer?: boolean;
}) {
  const [images, setImages] = useState<
    { src: string; caption?: string; isVideo?: boolean; href?: string }[]
  >(() =>
    Array.isArray(initialInstagramImages) ? initialInstagramImages : []
  );

  useEffect(() => {
    if (fromServer) return;
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data: Config) => {
        if (data.instagramImages) {
          setImages(data.instagramImages);
        }
      })
      .catch(() => {});
  }, [fromServer]);

  const hasGrid = useMemo(
    () => images.some((img) => typeof img.src === "string" && img.src.trim().length > 0),
    [images]
  );

  const visibleImages = useMemo(
    () => images.filter((img) => typeof img.src === "string" && img.src.trim().length > 0),
    [images]
  );

  const gridImages = useMemo(
    () => visibleImages.slice(0, COMMUNITY_GRID_MAX),
    [visibleImages]
  );

  if (!hasGrid || gridImages.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-brand-secondary pb-12 pt-10 md:pb-16 md:pt-14">
      <div
        className="pointer-events-none absolute -left-32 top-16 h-[28rem] w-[28rem] rounded-full bg-brand-accent/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-32 h-72 w-72 rounded-full bg-brand-primary/[0.035] blur-3xl"
        aria-hidden
      />

      <CommunityBridge />

      <div className="relative z-[1] mx-auto mb-14 max-w-7xl px-6 pt-2 text-center md:mb-16 md:pt-0 md:text-left">
        <span className="editorial-spacing text-brand-accent mb-4 block md:mb-5">
          Comunidad
        </span>
        <h2 className="mb-4 font-serif text-3xl tracking-tight text-brand-primary md:text-[2.75rem] md:leading-tight">
          Cocina, inspiración y{" "}
          <span className="italic text-brand-accent">comunidad</span>
        </h2>
        <p className="mx-auto max-w-2xl font-sans text-sm leading-relaxed text-brand-muted/85 md:mx-0 md:text-base">
          Encuéntrame en mis redes: recetas, ideas para la mesa y el día a
          día. Comparte tus creaciones y acompáñanos en la comunidad.
        </p>
      </div>

      <div
        className="mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-2.5 px-4 sm:gap-3 sm:px-5 md:gap-4 md:px-8 lg:grid-cols-5 lg:gap-4 lg:px-10"
      >
        {gridImages.map((img, index) => {
          const hrefResolved = resolveCommunityImageHref(img.href);
          const internal = isInternalCommunityHref(hrefResolved);
          const tileClass =
            index >= COMMUNITY_MOBILE_VISIBLE
              ? `${communityTileClass} max-lg:hidden`
              : communityTileClass;
          const tile = (
            <>
              <Image
                src={img.src}
                alt={img.caption || "Publicación de Bricia"}
                fill
                sizes="(max-width: 1024px) 48vw, 18vw"
                quality={PHOTO_IMAGE_QUALITY}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <ImageFrameFade variant="cream" />
              {img.isVideo && (
                <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center opacity-100 transition-opacity duration-300 group-hover:opacity-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/40 backdrop-blur-sm sm:h-12 sm:w-12">
                    <svg
                      className="ml-0.5 h-4 w-4 text-white/90 sm:h-5 sm:w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center bg-black/60 p-4 text-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:p-6">
                {img.caption && (
                  <p className="line-clamp-4 font-sans text-[11px] leading-relaxed text-white sm:text-xs">
                    {img.caption}
                  </p>
                )}
              </div>
            </>
          );
          return internal ? (
            <Link
              key={`${img.src}-${index}`}
              href={hrefResolved}
              className={tileClass}
            >
              {tile}
            </Link>
          ) : (
            <a
              key={`${img.src}-${index}`}
              href={hrefResolved}
              target="_blank"
              rel="noopener noreferrer"
              className={tileClass}
            >
              {tile}
            </a>
          );
        })}
      </div>
    </section>
  );
}
