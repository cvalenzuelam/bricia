"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { HERO_IMAGE_QUALITY } from "@/lib/image-quality";

interface HeroImage {
  src: string;
  alt: string;
}

interface HeroConfig {
  eyebrow?: string;
  titlePlain?: string;
  titleHighlight?: string;
  /** @deprecated Usar titlePlain + titleHighlight */
  title?: string;
  tagline: string;
  taglineMobile?: string;
  description: string;
  ctaText: string;
  /** Imagen hero escritorio (web) */
  collageImages: HeroImage[];
  /** Imagen hero móvil; si falta, usa collageImages[0] */
  mobileHeroImage?: HeroImage;
  backgroundColor: string;
}

const HERO_FALLBACK: HeroConfig = {
  eyebrow: "Bienvenidos a mi blog",
  titlePlain: "Historias que nacen",
  titleHighlight: "en la cocina",
  tagline:
    "Aquí la cocina cotidiana cobra vida a través de recetas cálidas, deliciosas y pensadas para disfrutarse en casa.",
  taglineMobile:
    "Aquí la cocina cotidiana cobra vida a través de recetas cálidas, deliciosas y pensadas para disfrutarse en casa.",
  description:
    "Celebramos esos momentos simples alrededor de la mesa y dejamos que los aromas, los sabores y los ingredientes despierten la curiosidad del paladar.",
  ctaText: "Ver recetas",
  collageImages: [
    { src: "/images/hero-inicio-bricia.jpg", alt: "Bricia en picnic al aire libre" },
  ],
  mobileHeroImage: {
    src: "/images/hero-inicio-bricia.jpg",
    alt: "Bricia en picnic al aire libre",
  },
  backgroundColor: "#FAF9F4",
};

const DEFAULT_BG = "#FAF9F4";
/** CTA del hero: corto (máx. ~3–4 palabras). Textos largos del CMS no deben ir en el botón. */
const HERO_CTA_MAX_CHARS = 22;

function resolveHeroCtaLabel(raw?: string): string {
  const label = raw?.trim().replace(/\s+/g, " ") ?? "";
  if (!label) return HERO_FALLBACK.ctaText;
  if (label.length > HERO_CTA_MAX_CHARS) return HERO_FALLBACK.ctaText;
  if (label.split(" ").length > 4) return HERO_FALLBACK.ctaText;
  return label;
}

function resolveTitleParts(config: HeroConfig): {
  plain: string;
  highlight: string;
} {
  if (config.titlePlain?.trim() && config.titleHighlight?.trim()) {
    return {
      plain: config.titlePlain.trim(),
      highlight: config.titleHighlight.trim(),
    };
  }
  if (config.title?.trim()) {
    const words = config.title.trim().split(/\s+/);
    if (words.length >= 3) {
      const highlight = words.slice(-2).join(" ");
      const plain = words.slice(0, -2).join(" ");
      return { plain, highlight };
    }
    if (words.length === 2) {
      return { plain: words[0], highlight: words[1] };
    }
    return { plain: config.title.trim(), highlight: "" };
  }
  return {
    plain: HERO_FALLBACK.titlePlain!,
    highlight: HERO_FALLBACK.titleHighlight!,
  };
}

function normalizeHeroImage(value: unknown): HeroImage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const o = value as Partial<HeroImage>;
  const src = typeof o.src === "string" ? o.src.trim() : "";
  if (!src) return undefined;
  return {
    src,
    alt: typeof o.alt === "string" && o.alt.trim() ? o.alt.trim() : "Foto principal de Bricia",
  };
}

function mergeHeroResponse(base: HeroConfig, patch: unknown): HeroConfig {
  if (!patch || typeof patch !== "object") return base;
  const d = patch as Partial<HeroConfig>;
  const mobileHeroImage =
    normalizeHeroImage(d.mobileHeroImage) ??
    (d.mobileHeroImage === null ? undefined : base.mobileHeroImage);
  return {
    ...base,
    ...d,
    collageImages:
      Array.isArray(d.collageImages) && d.collageImages.length > 0
        ? (d.collageImages as HeroConfig["collageImages"])
        : base.collageImages,
    mobileHeroImage,
  };
}

export default function Hero({
  initialHero,
}: {
  initialHero?: unknown;
}) {
  const [config, setConfig] = useState<HeroConfig>(() =>
    mergeHeroResponse(HERO_FALLBACK, initialHero)
  );

  useEffect(() => {
    if (initialHero !== undefined) return;
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data: unknown) => {
        setConfig((prev) => mergeHeroResponse(prev, data));
      })
      .catch(() => {});
  }, [initialHero]);

  const desktopImage =
    config.collageImages?.[0]?.src || "/images/hero-inicio-bricia.jpg";
  const desktopAlt =
    config.collageImages?.[0]?.alt || "Foto principal de Bricia";
  const mobileImage =
    config.mobileHeroImage?.src?.trim() || desktopImage;
  const mobileAlt =
    config.mobileHeroImage?.alt?.trim() || desktopAlt;

  const bg = config.backgroundColor || DEFAULT_BG;
  const { plain: titlePlain, highlight: titleHighlight } = resolveTitleParts(config);
  const eyebrow = config.eyebrow?.trim() || HERO_FALLBACK.eyebrow!;
  const ctaLabel = resolveHeroCtaLabel(config.ctaText);
  const tagline =
    config.taglineMobile?.trim() || config.tagline?.trim() || HERO_FALLBACK.tagline;

  return (
    <section
      className="relative isolate w-full overflow-hidden max-md:min-h-[78svh] md:min-h-[100svh]"
      style={{ backgroundColor: bg }}
    >
      {/* Foto a sangre — web y móvil independientes (CMS) */}
      <motion.div
        initial={{ scale: 1.03 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 overflow-hidden"
      >
        <Image
          src={mobileImage}
          alt={mobileAlt}
          fill
          priority
          sizes="100vw"
          quality={HERO_IMAGE_QUALITY}
          className="object-cover object-[58%_22%] md:hidden"
        />
        <Image
          src={desktopImage}
          alt={desktopAlt}
          fill
          priority
          sizes="100vw"
          quality={HERO_IMAGE_QUALITY}
          className="object-cover object-[center_30%] hidden md:block"
        />
      </motion.div>

      {/* Veladura ligera solo para legibilidad del texto — sin fundido crema (se veía borroso en móvil) */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent md:from-black/25"
        aria-hidden
      />

      {/* Texto sobre la imagen */}
      <div className="relative z-10 flex max-md:min-h-[78svh] md:min-h-[100svh] flex-col justify-end">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-14 pb-10 md:pb-20 lg:pb-24 pt-[max(6.5rem,env(safe-area-inset-top,0px)+5rem)]">
          <div className="max-w-xl lg:max-w-[34rem] space-y-4 md:space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="text-[11px] md:text-[12px] font-sans font-medium tracking-[0.42em] uppercase text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.65),0_6px_24px_rgba(0,0,0,0.5)]"
            >
              {eyebrow}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-white tracking-tight leading-[1.05] [text-shadow:0_2px_6px_rgba(0,0,0,0.7),0_10px_32px_rgba(0,0,0,0.55)]"
            >
              <span className="block text-[2.35rem] sm:text-[2.85rem] md:text-[3.75rem] lg:text-[4.25rem]">
                {titlePlain}
              </span>
              {titleHighlight ? (
                <span className="block text-[2.35rem] sm:text-[2.85rem] md:text-[3.75rem] lg:text-[4.25rem] italic text-[#E8D5B0] mt-1">
                  {titleHighlight}
                </span>
              ) : null}
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-14 h-px bg-[#E8D5B0] origin-left shadow-[0_1px_8px_rgba(0,0,0,0.45)]"
              aria-hidden
            />

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md text-[14px] md:text-[16px] font-sans text-white leading-relaxed [text-shadow:0_2px_4px_rgba(0,0,0,0.65),0_6px_22px_rgba(0,0,0,0.5)]"
            >
              {tagline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="pt-1 md:pt-2"
            >
              <Link
                href="/recetas"
                className="group relative inline-flex w-auto max-w-full items-center gap-2.5 overflow-hidden rounded-full border border-white/90 bg-white px-6 py-3 text-[11px] font-sans font-semibold tracking-[0.22em] uppercase text-brand-primary shadow-[0_10px_28px_rgba(0,0,0,0.28)] btn-lift hover:border-[#E8D5B0] hover:bg-[#E8D5B0] hover:shadow-[0_14px_32px_rgba(0,0,0,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
              >
                <span
                  className="hero-cta-sheen pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  aria-hidden
                />
                <span className="relative truncate">{ctaLabel}</span>
                <ArrowRight
                  size={14}
                  strokeWidth={1.75}
                  className="relative shrink-0 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
