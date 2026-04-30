"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { PHOTO_IMAGE_QUALITY } from "@/lib/image-quality";

/** Mismo negro editorial que `--color-brand-primary` (resto del sitio). */
const BRAND_DARK = "#1D1D1B";

const FONT_MAP: Record<string, string> = {
  serif: "var(--font-playfair)",
  sans: "var(--font-inter)",
  aboreto: "var(--font-aboreto)",
};

export interface FeaturedSectionConfig {
  imageSrc: string;
  imageAlt: string;
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
  imageAlt: "Nuevas Recetas Cada Semana",
  panelBackgroundColor: BRAND_DARK,
  heading: "Nuevas Recetas\nCada Semana",
  description:
    "Descubre recetas que tocan el corazón y despiertan tus sentidos. Cada semana traemos algo nuevo para que disfrutes en tu cocina. ¡Explora y déjate inspirar!",
  ctaText: "Ver Recetas",
  ctaHref: "/recetas",
  titleFont: "serif",
  buttonBackgroundColor: "#FFFFFF",
  buttonTextColor: BRAND_DARK,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return { r: 29, g: 29, b: 27 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

/** Costados: opacidad plena en el borde para empatar con el panel sólido del vecino. */
function featuredImageEdgeStops(panelHex: string): string {
  const { r, g, b } = hexToRgb(panelHex);
  return [
    `rgba(${r},${g},${b},1) 0%`,
    `rgba(${r},${g},${b},0.82) 5%`,
    `rgba(${r},${g},${b},0.5) 14%`,
    `rgba(${r},${g},${b},0.22) 28%`,
    `rgba(${r},${g},${b},0.06) 44%`,
    `transparent 72%`,
  ].join(", ");
}
/** Paradas laterales en móvil (misma lógica, un poco más suave). */
function featuredImageEdgeStopsMobile(panelHex: string): string {
  const { r, g, b } = hexToRgb(panelHex);
  return [
    `rgba(${r},${g},${b},1) 0%`,
    `rgba(${r},${g},${b},0.75) 7%`,
    `rgba(${r},${g},${b},0.35) 20%`,
    `rgba(${r},${g},${b},0.1) 38%`,
    `transparent 70%`,
  ].join(", ");
}

/** Desktop: refuerzo en costados (la máscara de la imagen ya empluma; esto homogeneiza el tono). */
function featuredImageOverlayStyle(panelHex: string): CSSProperties {
  const { r, g, b } = hexToRgb(panelHex);
  const stops = featuredImageEdgeStops(panelHex);
  return {
    background: [
      `linear-gradient(to top, rgba(${r},${g},${b},0.09) 0%, transparent 28%)`,
      `linear-gradient(to left, ${stops})`,
      `linear-gradient(to right, ${stops})`,
    ].join(", "),
  };
}

/** Móvil: fundido hacia el panel encima + costados (refuerzo encima del máscara). */
function featuredImageMobileOverlayStyle(panelHex: string): CSSProperties {
  const { r, g, b } = hexToRgb(panelHex);
  const sideStops = featuredImageEdgeStopsMobile(panelHex);
  return {
    background: [
      `linear-gradient(to bottom, rgba(${r},${g},${b},0.52) 0%, rgba(${r},${g},${b},0.28) 10%, rgba(${r},${g},${b},0.12) 22%, transparent 48%)`,
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

  const titleFont = FONT_MAP[featured.titleFont] || FONT_MAP.serif;
  const headingLines = featured.heading.split(/\r?\n/).filter((line) => line.length > 0);
  const panel = featured.panelBackgroundColor;
  const mobileImageOverlay = featuredImageMobileOverlayStyle(panel);

  return (
    <section
      id="seccion-destacada"
      className="relative scroll-mt-24 overflow-x-hidden overflow-y-visible pb-0 pt-0 md:scroll-mt-28"
      style={{ backgroundColor: panel }}
    >
      {/* Puente hero (crema) → panel: ola orgánica que se superpone un poco al hero */}
      <div
        className="pointer-events-none relative z-[3] max-md:-mt-4 max-md:bg-brand-secondary md:-mt-[2.75rem] lg:-mt-[3rem] w-full select-none"
        aria-hidden
      >
        <svg
          viewBox="0 0 1200 56"
          role="presentation"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="relative z-[2] block h-[clamp(2.5rem,6.5vw,3.75rem)] w-[115%] max-w-none -translate-x-[7.5%] text-brand-secondary max-md:drop-shadow-none md:h-16 md:w-[110%] md:-translate-x-[5%] md:drop-shadow-[0_-6px_18px_rgba(29,29,27,0.055)]"
        >
          <path fill="currentColor" d="M0 0h1200v28Q600 58 0 28V0z" />
        </svg>
        {/* Solo desktop: en móvil el degradado a negro quedaba visible sobre el padding crema del hero. */}
        <div
          className="pointer-events-none absolute inset-x-[5%] bottom-0 z-[1] hidden h-10 md:block md:inset-x-[3%] md:h-14"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${panel} 72%)`,
          }}
        />
      </div>

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
            sizes="50vw"
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

        {/* Panel: contenido centrado en la columna, sin pegarlo al borde de la foto */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="relative z-[3] flex flex-col justify-center px-8 py-16 text-center text-white max-md:py-10 md:w-1/2 md:basis-1/2 md:px-10 md:py-20 lg:px-14"
          style={{ backgroundColor: panel }}
        >
          <div className="relative z-[1] mx-auto w-full max-w-md space-y-8">
            <h2
              className="text-4xl leading-tight md:text-5xl"
              style={{ fontFamily: titleFont }}
            >
              {headingLines.map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </h2>

            <div className="mx-auto h-px w-12 bg-white/30"></div>

            <p
              className="text-sm leading-relaxed text-white/80 md:text-base"
              style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            >
              {featured.description}
            </p>

            <div className="flex justify-center pt-2">
              <Link
                href={featured.ctaHref || "/recetas"}
                className="group relative inline-flex w-fit max-w-full items-center gap-3 overflow-hidden rounded-full border border-transparent py-3.5 pl-9 pr-3 text-[11px] font-sans font-bold tracking-[0.26em] uppercase shadow-[0_8px_32px_-6px_rgba(20,15,12,0.28)] ring-1 ring-black/[0.07] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/25 before:to-transparent before:opacity-0 before:transition-opacity before:duration-500 hover:-translate-y-1 hover:!border-[#C2A878] hover:!bg-[#C2A878] hover:!text-brand-primary hover:shadow-[0_14px_44px_-12px_rgba(194,168,120,0.42)] hover:ring-[#C2A878]/55 hover:before:opacity-100 hover:before:from-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2A878]/70 active:translate-y-0 md:gap-3.5 md:py-4 md:pl-10 md:pr-3.5"
                style={{
                  backgroundColor: featured.buttonBackgroundColor,
                  color: featured.buttonTextColor,
                }}
              >
                <span className="relative z-[1] pr-0.5">{featured.ctaText}</span>
                <span
                  className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500 group-hover:scale-105 group-hover:!border-brand-primary/35 group-hover:!bg-white/35 md:h-11 md:w-11"
                  style={{
                    borderColor: `${featured.buttonTextColor}33`,
                    backgroundColor: `${featured.buttonTextColor}14`,
                  }}
                  aria-hidden
                >
                  <ArrowRight
                    className="h-3.5 w-3.5 text-current transition-transform duration-500 group-hover:translate-x-0.5 md:h-4 md:w-4"
                    strokeWidth={1.75}
                  />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
