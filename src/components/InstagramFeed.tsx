"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { PHOTO_IMAGE_QUALITY } from "@/lib/image-quality";
import ImageFrameFade from "@/components/ImageFrameFade";
import { SectionIntro, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { duration, easeOutExpo } from "@/lib/motion";

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

export default function InstagramFeed({
  initialInstagramImages,
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

      <div className="relative z-[1] mx-auto mb-14 max-w-7xl px-6 pt-2 md:mb-16 md:pt-0">
        <SectionIntro
          eyebrow="Comunidad"
          title={
            <>
              cocina, inspiración y{" "}
              <span className="italic text-brand-accent">comunidad</span>
            </>
          }
          subtitle="Encuéntrame en mis redes: recetas, ideas para la mesa y el día a día. Comparte tus creaciones y acompáñanos en la comunidad."
          titleClassName="mb-0 font-serif text-5xl md:text-7xl text-brand-primary lowercase tracking-tighter"
        />
      </div>

      <Stagger
        fast
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
          return (
            <StaggerItem key={`${img.src}-${index}`}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: duration.fast, ease: easeOutExpo }}
              >
                {internal ? (
                  <Link href={hrefResolved} className={tileClass}>
                    {tile}
                  </Link>
                ) : (
                  <a
                    href={hrefResolved}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={tileClass}
                  >
                    {tile}
                  </a>
                )}
              </motion.div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
