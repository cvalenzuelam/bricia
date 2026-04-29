"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, type ReactNode } from "react";

const DEFAULT_INSTAGRAM_PROFILE_HREF =
  "https://www.instagram.com/briciaelizalde/";

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

/**
 * Cola del collage en lg (rejilla 4 columnas, tras el bloque índices 0–4).
 * Filas completas de 4 → celdas 1×1; última fila incompleta: 2+2, 2+1+1 o 1 ancho.
 */
function lgTailGridClass(positionInTail: number, tailCount: number): string {
  if (tailCount <= 0) return "";
  const fullRows = Math.floor(tailCount / 4);
  const rem = tailCount % 4;
  const idxFirstPartial = fullRows * 4;

  if (positionInTail < idxFirstPartial) {
    return "lg:col-span-1 lg:aspect-square";
  }

  const local = positionInTail - idxFirstPartial;

  if (rem === 1) {
    return "lg:aspect-[21/9] lg:max-h-[min(24rem,28vw)]";
  }
  if (rem === 2) {
    return "lg:col-span-2 lg:aspect-square";
  }
  if (rem === 3) {
    if (local === 0) return "lg:col-span-2 lg:aspect-square";
    return "lg:col-span-1 lg:aspect-square";
  }
  return "lg:col-span-1 lg:aspect-square";
}

/** Collage: móvil = rejilla alineada; lg = bento + cola sin huecos (cualquier N desde el CMS). */
function collageCellClass(index: number, total: number): string {
  const base =
    "group relative block overflow-hidden rounded-2xl bg-brand-primary/[0.04] ring-1 ring-black/[0.05] shadow-[0_2px_20px_-6px_rgba(29,29,27,0.1)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:z-20 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-12px_rgba(29,29,27,0.18)] md:rounded-3xl";

  const last = index === total - 1;
  /** Ancho completo en 2 cols: altura = mitad del ancho → encaja con una fila de dos cuadrados. */
  const mobFullW = "col-span-2 aspect-[2/1]";

  if (total < 5) {
    const hero = index === 0;
    if (hero) {
      return `${base} ${mobFullW} lg:col-span-2 lg:aspect-[5/3]`;
    }
    return `${base} col-span-1 aspect-square`;
  }

  if (index === 0) {
    return `${base} ${mobFullW} lg:col-span-2 lg:row-span-2 lg:aspect-auto lg:min-h-[min(52vw,26rem)]`;
  }

  if (index >= 1 && index <= 4) {
    return `${base} col-span-1 aspect-square`;
  }

  const tailLen = total - 5;
  const posInTail = index - 5;
  const lgTail = lgTailGridClass(posInTail, tailLen);
  /** Móvil: franja 2:1; lg: ancho completo (col-span-2 sin prefijo rompía el span en desktop). */
  const panoramicLastMobile = last && total >= 6 && tailLen % 4 === 1;

  if (panoramicLastMobile) {
    return `${base} max-lg:col-span-2 max-lg:aspect-[2/1] lg:col-span-full lg:w-full lg:min-w-0 lg:aspect-[21/9] lg:max-h-[min(24rem,28vw)]`;
  }

  return `${base} col-span-1 aspect-square ${lgTail}`;
}

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
  children,
  initialInstagramImages,
  /** true cuando el home SSR ya cargó instagramImages desde hero */
  fromServer = false,
}: {
  children?: ReactNode;
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

  if (!children && !hasGrid) return null;

  return (
    <section className="relative overflow-hidden bg-brand-secondary pb-0">
      <div
        className="pointer-events-none absolute -left-32 top-16 h-[28rem] w-[28rem] rounded-full bg-brand-accent/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-32 h-72 w-72 rounded-full bg-brand-primary/[0.035] blur-3xl"
        aria-hidden
      />

      {children}

      {hasGrid && (
        <>
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
            className="mx-auto grid w-full max-w-[1600px] grid-cols-2 grid-flow-row gap-2.5 px-3 sm:gap-3 sm:px-5 md:gap-4 md:px-8 lg:grid-cols-4 lg:gap-5"
          >
            {visibleImages.map((img, index) => {
              const hrefResolved = resolveCommunityImageHref(img.href);
              const internal = isInternalCommunityHref(hrefResolved);
              const cellClass = collageCellClass(
                index,
                visibleImages.length
              );
              const tile = (
                <>
                  <Image
                    src={img.src}
                    alt={img.caption || "Publicación de Bricia"}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {img.isVideo && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-300 group-hover:opacity-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/40 backdrop-blur-sm">
                        <svg
                          className="ml-0.5 h-5 w-5 text-white/90"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-6 text-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    {img.caption && (
                      <p className="line-clamp-4 font-sans text-xs leading-relaxed text-white">
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
                  className={cellClass}
                >
                  {tile}
                </Link>
              ) : (
                <a
                  key={`${img.src}-${index}`}
                  href={hrefResolved}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cellClass}
                >
                  {tile}
                </a>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
