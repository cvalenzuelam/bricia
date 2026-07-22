"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { duration, easeOutExpo, viewportOnce } from "@/lib/motion";
import { useEffect, useState } from "react";
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
  eyebrow: "",
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

function resolveFeaturedCtaLabel(raw?: string): string {
  const label = raw?.trim().replace(/\s+/g, " ") ?? "";
  if (!label || label.length > 22 || label.split(" ").length > 4) {
    return DEFAULT_FEATURED.ctaText;
  }
  return label;
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

/**
 * Escala cercana a La Tienda en landing: franja alta, tipografía grande,
 * foto a sangre + panel tipográfico (sin ser un segundo hero).
 */
export default function FeaturedRecipe({
  initialFeatured,
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
  const panel = featured.panelBackgroundColor || BRAND_DARK;
  const eyebrow = featured.eyebrow?.trim() || "En temporada";
  const ctaLabel = resolveFeaturedCtaLabel(featured.ctaText);

  return (
    <section
      id="seccion-destacada"
      className="relative scroll-mt-24 md:scroll-mt-28"
      style={{ backgroundColor: panel }}
    >
      <div className="grid w-full grid-cols-1 md:grid-cols-12 md:min-h-[88vh] lg:min-h-[92vh]">
        {/* Foto a sangre — ocupa casi toda la altura de viewport */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: duration.slow, ease: easeOutExpo }}
          className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/11] md:col-span-7 md:aspect-auto md:min-h-full lg:col-span-7"
        >
          <Image
            src={featured.imageSrc}
            alt={featured.imageAlt}
            fill
            sizes="(max-width: 767px) 100vw, 58vw"
            quality={PHOTO_IMAGE_QUALITY}
            className="object-cover object-center"
            priority={false}
          />
        </motion.div>

        {/* Panel tipográfico — escala tipo La Tienda */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: duration.slow, delay: 0.08, ease: easeOutExpo }}
          className="relative flex flex-col justify-center md:col-span-5 px-8 py-20 sm:px-12 md:px-12 md:py-24 lg:px-16 xl:px-20 lg:py-28"
          style={{ backgroundColor: panel }}
        >
          <div className="mx-auto w-full max-w-lg space-y-8 md:mx-0 md:max-w-none md:space-y-10">
            <p className="text-[11px] font-sans font-bold tracking-[0.42em] uppercase text-[#C2A878]">
              {eyebrow}
            </p>

            <h2 className="font-serif text-5xl sm:text-6xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-white">
              <span className="block lowercase">{headingPlain}</span>
              {headingHighlight ? (
                <span className="mt-2 block italic text-[#E8D5B0] lowercase">
                  {headingHighlight}
                </span>
              ) : null}
            </h2>

            <div className="w-14 h-px bg-[#C2A878]/45" aria-hidden />

            <p className="text-base md:text-lg font-serif italic text-white/70 leading-relaxed max-w-md">
              {featured.description}
            </p>

            <div className="pt-2">
              <Link
                href={featured.ctaHref || "/recetas"}
                className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 text-[11px] font-sans font-semibold tracking-[0.22em] uppercase text-brand-primary shadow-[0_10px_28px_rgba(0,0,0,0.25)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#E8D5B0] hover:shadow-[0_14px_32px_rgba(0,0,0,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D1D1B]"
              >
                <span>{ctaLabel}</span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 transition-colors group-hover:bg-brand-primary/15">
                  <ArrowRight
                    size={13}
                    strokeWidth={1.75}
                    className="transition-transform duration-400 group-hover:translate-x-0.5"
                    aria-hidden
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
