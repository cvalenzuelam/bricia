"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useState, useEffect } from "react";
import { HERO_IMAGE_QUALITY } from "@/lib/image-quality";
import {
  heroBottomFadeStyle,
  heroBottomFadeStyleWeb,
  heroMainImageOverlayStyle,
  heroMainImageOverlayStyleWeb,
} from "@/lib/image-frame-fade";

interface HeroConfig {
  title: string;
  titleColor: string;
  titleFont: string;
  logo: string;
  logoColor: string;
  logoFont: string;
  tagline: string;
  /** Frase corta solo en móvil (el logo del hero se oculta en móvil porque ya está en el nav). */
  taglineMobile?: string;
  taglineItalic: boolean;
  description: string;
  ctaText: string;
  collageImages: { src: string; alt: string }[];
  backgroundColor: string;
}

/** Contenido por defecto (local) para que el landing nunca quede sin título mientras carga el CMS. */
const HERO_FALLBACK: HeroConfig = {
  title: "Historias que nacen en la cocina",
  titleColor: "#5C3D2E",
  titleFont: "serif",
  logo: "|BRICIA|",
  logoColor: "#1D1D1B",
  logoFont: "aboreto",
  tagline: "Un blog que celebra la cocina emocional y los placeres cotidianos.",
  taglineMobile:
    "Cocina emocional y cotidiana: recetas cálidas para disfrutar en casa.",
  taglineItalic: true,
  description:
    "Aquí la cocina cotidiana cobra vida a través de recetas cálidas, deliciosas y pensadas para disfrutarse en casa.",
  ctaText: "Ven para descubrir recetas inspiradoras cada semana.",
  collageImages: [
    { src: "/images/hero-inicio-bricia.jpg", alt: "Bricia en picnic al aire libre" },
  ],
  backgroundColor: "#FAF9F4",
};

const FONT_MAP: Record<string, string> = {
  serif: "var(--font-playfair)",
  sans: "var(--font-inter)",
  aboreto: "var(--font-aboreto)",
};

const DEFAULT_BG = "#FAF9F4";

function mergeHeroResponse(
  base: HeroConfig,
  patch: unknown
): HeroConfig {
  if (!patch || typeof patch !== "object") return base;
  const d = patch as Partial<HeroConfig>;
  return {
    ...base,
    ...d,
    collageImages:
      Array.isArray(d.collageImages) && d.collageImages.length > 0
        ? (d.collageImages as HeroConfig["collageImages"])
        : base.collageImages,
  };
}

export default function Hero({
  initialHero,
}: {
  /** Si llega desde el servidor (ej. página de inicio), no hacemos fetch extra a /api/hero */
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

  const heroImage =
    config.collageImages?.[0]?.src || "/images/hero-inicio-bricia.jpg";
  const heroImageAlt =
    config.collageImages?.[0]?.alt || "Foto principal de Bricia";

  const bg = config.backgroundColor || DEFAULT_BG;
  const overlayStyleMobile = heroMainImageOverlayStyle(bg);
  const overlayStyleWeb = heroMainImageOverlayStyleWeb(bg);
  /** Móvil: sin min-h forzado (evita franja crema vacía). Escritorio: igual que antes. */
  const sectionMinH = "max-md:min-h-0 md:min-h-[calc(62vw*1.12)]";

  return (
    <section
      className={`relative ${sectionMinH} flex flex-col max-md:gap-7 max-md:pb-8 md:flex-row md:gap-0 overflow-hidden md:pb-8`}
      style={{ backgroundColor: bg }}
    >
      {/* Texto — izquierda (móvil: arriba), columna más estrecha */}
      <div
        className={`relative w-full md:w-[38%] flex flex-col items-center justify-center px-8 md:px-10 lg:px-14 max-md:pb-1 max-md:pt-[max(6.75rem,env(safe-area-inset-top,0px)+5.25rem)] md:pb-2 md:pt-5 md:min-h-[calc(62vw*1.12)] text-center`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-lg w-full"
        >
          <div className="max-md:space-y-5 md:space-y-8 md:-translate-y-28 lg:-translate-y-36">
          <div className="max-md:space-y-4 md:space-y-6">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl leading-tight"
              style={{
                fontFamily: FONT_MAP[config.titleFont] || FONT_MAP.serif,
                color: config.titleColor,
              }}
            >
              {config.title}
            </h1>
            <span
              className="hidden md:block text-4xl md:text-5xl lg:text-6xl tracking-[0.2em]"
              style={{
                color: config.logoColor,
                fontFamily: FONT_MAP[config.logoFont] || FONT_MAP.aboreto,
              }}
            >
              {config.logo}
            </span>
          </div>

          <div className="max-md:space-y-4 max-md:pt-1 md:space-y-6">
            <p
              className="md:hidden text-sm font-serif leading-snug text-brand-primary/85"
              style={{
                fontStyle: config.taglineItalic ? "italic" : "normal",
              }}
            >
              {(config.taglineMobile && config.taglineMobile.trim()) ||
                HERO_FALLBACK.taglineMobile}
            </p>
            <p
              className="hidden md:block text-base md:text-lg font-serif leading-relaxed text-brand-primary/85"
              style={{
                fontStyle: config.taglineItalic ? "italic" : "normal",
              }}
            >
              {config.tagline}
            </p>
            <p className="hidden md:block text-sm font-sans text-brand-muted leading-relaxed">
              {config.description}
            </p>
            <Link
              href="/recetas"
              className="block text-[10px] font-sans tracking-[0.18em] md:text-xs md:tracking-[0.25em] uppercase font-medium text-brand-accent leading-snug transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary rounded-sm"
            >
              {config.ctaText}
            </Link>
          </div>

          <motion.a
            href="#seccion-destacada"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="hidden md:inline-flex pt-4 text-brand-primary/35 transition-colors hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary rounded-full"
            aria-label="Bajar a la sección destacada"
          >
            <ArrowDown size={28} strokeWidth={1} className="mx-auto" aria-hidden />
          </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Foto — derecha (móvil: debajo del texto), columna más ancha */}
      <div
        className={`relative z-[1] w-full md:w-[62%] aspect-[5/4] md:aspect-auto md:min-h-[calc(62vw*1.12)] overflow-hidden min-h-[48svh] max-md:min-h-0 max-md:isolate max-md:[transform:translateZ(0)]`}
        style={{ backgroundColor: bg }}
      >
        <Image
          src={heroImage}
          alt={heroImageAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 62vw"
          quality={HERO_IMAGE_QUALITY}
          className="hero-inicio-img-mask object-cover object-center max-md:origin-bottom max-md:scale-[1.04]"
        />
        <div
          className="absolute inset-0 pointer-events-none md:hidden"
          style={overlayStyleMobile}
        />
        <div
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={overlayStyleWeb}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[min(38%,12rem)] md:hidden"
          style={heroBottomFadeStyle(bg)}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] hidden md:block h-32"
          style={heroBottomFadeStyleWeb(bg)}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[3px] max-md:block md:hidden"
          style={{ backgroundColor: bg }}
          aria-hidden
        />
      </div>
    </section>
  );
}
