"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";
import { PHOTO_IMAGE_QUALITY } from "@/lib/image-quality";

/** Mismo negro editorial que `--color-brand-primary` (resto del sitio). */
const BRAND_DARK = "#1D1D1B";

export interface FeaturedSectionConfig {
  imageSrc: string;
  imageAlt: string;
  eyebrow?: string;
  panelBackgroundColor: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  titleFont: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
}

const DEFAULT_FEATURED: FeaturedSectionConfig = {
  imageSrc: "/images/tiradito.png",
  imageAlt: "Nuevas recetas cada semana",
  eyebrow: "Cada semana",
  panelBackgroundColor: BRAND_DARK,
  heading: "Nuevas recetas\nCada semana",
  description:
    "Descubre recetas que tocan el corazón y despiertan tus sentidos. Cada semana traemos algo nuevo para que disfrutes en tu cocina. ¡Explora y déjate inspirar!",
  ctaText: "Ver recetas",
  ctaHref: "/recetas",
  titleFont: "serif",
  buttonBackgroundColor: "#FFFFFF",
  buttonTextColor: BRAND_DARK,
};

function resolveHeadingParts(heading: string): { plain: string; highlight: string } {
  const lines = heading.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    return { plain: lines[0], highlight: lines[1] };
  }
  const words = (lines[0] ?? heading).trim().split(/\s+/);
  if (words.length >= 3) {
    return {
      plain: words.slice(0, -2).join(" "),
      highlight: words.slice(-2).join(" "),
    };
  }
  if (words.length === 2) {
    return { plain: words[0], highlight: words[1] };
  }
  return { plain: lines[0] ?? heading, highlight: "" };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return { r: 29, g: 29, b: 27 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

/** Costados (solo desktop): fundido muy suave hacia el panel. */
function featuredImageEdgeStops(panelHex: string): string {
  const { r, g, b } = hexToRgb(panelHex);
  return [
    `rgba(${r},${g},${b},0.42) 0%`,
    `rgba(${r},${g},${b},0.22) 10%`,
    `rgba(${r},${g},${b},0.10) 26%`,
    `rgba(${r},${g},${b},0.03) 45%`,
    `transparent 68%`,
  ].join(", ");
}
/** Paradas laterales en móvil. */
function featuredImageEdgeStopsMobile(panelHex: string): string {
  const { r, g, b } = hexToRgb(panelHex);
  return [
    `rgba(${r},${g},${b},0.82) 0%`,
    `rgba(${r},${g},${b},0.55) 7%`,
    `rgba(${r},${g},${b},0.26) 20%`,
    `rgba(${r},${g},${b},0.07) 38%`,
    `transparent 70%`,
  ].join(", ");
}

/** Desktop: viñeta superior mínima + costados sutiles. */
function featuredImageOverlayStyle(panelHex: string): CSSProperties {
  const { r, g, b } = hexToRgb(panelHex);
  const stops = featuredImageEdgeStops(panelHex);
  return {
    background: [
      `linear-gradient(to top, rgba(${r},${g},${b},0.02) 0%, transparent 16%)`,
      `linear-gradient(to left, ${stops})`,
      `linear-gradient(to right, ${stops})`,
    ].join(", "),
  };
}

/** Móvil: fundido superior y costados, más contenido. */
function featuredImageMobileOverlayStyle(panelHex: string): CSSProperties {
  const { r, g, b } = hexToRgb(panelHex);
  const sideStops = featuredImageEdgeStopsMobile(panelHex);
  return {
    background: [
      `linear-gradient(to bottom, rgba(${r},${g},${b},0.28) 0%, rgba(${r},${g},${b},0.14) 8%, rgba(${r},${g},${b},0.05) 18%, transparent 36%)`,
      `linear-gradient(to left, ${sideStops})`,
      `linear-gradient(to right, ${sideStops})`,
    ].join(", "),
  };
}

function mergeFeatured(raw: unknown): FeaturedSectionConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_FEATURED };
  const f = raw as Partial<FeaturedSectionConfig>;
  return {
    ...DEFAULT_FEATURED,
    ...f,
    imageSrc: typeof f.imageSrc === "string" && f.imageSrc ? f.imageSrc : DEFAULT_FEATURED.imageSrc,
    heading: typeof f.heading === "string" && f.heading ? f.heading : DEFAULT_FEATURED.heading,
  };
}

export default function FeaturedRecipe({
  initialFeatured,
  /** true en la página de inicio SSR: evita segundo fetch incluso si featured viene vacío */
  fromServer = false,
}: {
  initialFeatured?: unknown;
  fromServer?: boolean;
}) {
  const [featured, setFeatured] = useState<FeaturedSectionConfig>(() =>
    mergeFeatured(initialFeatured)
  );

  useEffect(() => {
    if (fromServer) return;
    fetch("/api/hero")
      .then((res) => res.json())
      .then((config) => {
        setFeatured(mergeFeatured(config?.featuredSection));
      })
      .catch(() => {});
  }, [fromServer]);

  const { plain: headingPlain, highlight: headingHighlight } = resolveHeadingParts(
    featured.heading
  );
  const panel = featured.panelBackgroundColor;
  const mobileImageOverlay = featuredImageMobileOverlayStyle(panel);
  const eyebrow = featured.eyebrow?.trim() || DEFAULT_FEATURED.eyebrow!;

  return (
    <section
      id="seccion-destacada"
      className="relative scroll-mt-24 overflow-x-hidden overflow-y-visible pb-0 pt-0 md:scroll-mt-28"
      style={{ backgroundColor: panel }}
    >
      <div className="relative z-[1] mx-auto flex min-h-0 max-w-[1600px] flex-col-reverse items-stretch md:min-h-[70vh] md:flex-row">

        {/* Left: Full-bleed image */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="relative max-md:min-h-[38vh] md:min-h-full md:w-1/2 md:flex-shrink-0 md:basis-1/2"
          style={{ backgroundColor: panel }}
        >
          <Image
            src={featured.imageSrc}
            alt={featured.imageAlt}
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            quality={PHOTO_IMAGE_QUALITY}
            className="featured-recipe-img-mask object-cover"
          />
          {/* Móvil: fundido con el texto encima + ambos costados */}
          <div
            className="pointer-events-none absolute inset-0 z-[2] md:hidden"
            style={mobileImageOverlay}
            aria-hidden
          />
          {/* Desktop: viñeta + fundido izquierda y derecha hacia el panel */}
          <div
            className="pointer-events-none absolute inset-0 z-[2] hidden md:block"
            style={featuredImageOverlayStyle(panel)}
            aria-hidden
          />
        </motion.div>

        {/* Panel editorial — alineado a la izquierda, tipografía del sitio */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="relative z-[3] flex flex-col justify-center px-8 py-16 text-left max-md:py-12 md:w-1/2 md:basis-1/2 md:px-10 md:py-20 lg:px-14 xl:px-16"
          style={{ backgroundColor: panel }}
        >
          <div className="relative z-[1] mx-auto w-full max-w-lg space-y-8 md:mx-0">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-[10px] font-sans font-bold tracking-[0.45em] uppercase text-brand-accent"
            >
              {eyebrow}
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-serif text-white/95 leading-[1.05] tracking-tight"
            >
              {headingPlain}
              {headingHighlight ? (
                <>
                  <br />
                  <span className="italic text-brand-accent">{headingHighlight}</span>
                </>
              ) : null}
            </motion.h2>

            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-12 h-px bg-brand-accent opacity-35 origin-left"
            />

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base md:text-lg font-serif text-white/70 leading-relaxed"
            >
              {featured.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-2"
            >
              <Link
                href={featured.ctaHref || "/recetas"}
                className="inline-flex items-center gap-3 text-[10px] font-sans font-bold tracking-[0.35em] uppercase text-brand-accent transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary rounded-sm"
              >
                {featured.ctaText}
                <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
