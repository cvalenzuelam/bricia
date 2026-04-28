"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Fragment, useEffect, useState } from "react";

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
  panelBackgroundColor: "#8B7355",
  heading: "Nuevas Recetas\nCada Semana",
  description:
    "Descubre recetas que tocan el corazón y despiertan tus sentidos. Cada semana traemos algo nuevo para que disfrutes en tu cocina. ¡Explora y déjate inspirar!",
  ctaText: "Ver Recetas",
  ctaHref: "/recetas",
  titleFont: "serif",
  buttonBackgroundColor: "#FFFFFF",
  buttonTextColor: "#8B7355",
};

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

export default function FeaturedRecipe() {
  const [featured, setFeatured] = useState<FeaturedSectionConfig>(DEFAULT_FEATURED);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((config) => {
        setFeatured(mergeFeatured(config?.featuredSection));
      })
      .catch(() => {});
  }, []);

  const titleFont = FONT_MAP[featured.titleFont] || FONT_MAP.serif;
  const headingLines = featured.heading.split(/\r?\n/).filter((line) => line.length > 0);

  return (
    <section
      className="py-0 overflow-hidden"
      style={{ backgroundColor: featured.panelBackgroundColor }}
    >
      <div className="max-w-[1600px] mx-auto flex flex-col-reverse md:flex-row items-stretch min-h-[70vh]">

        {/* Left: Full-bleed image */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="md:w-1/2 relative min-h-[50vh] md:min-h-full"
        >
          <Image
            src={featured.imageSrc}
            alt={featured.imageAlt}
            fill
            sizes="50vw"
            className="object-cover"
          />
        </motion.div>

        {/* Right: Content on warm bg */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="md:w-1/2 flex flex-col justify-center px-12 md:px-20 py-20 text-white"
          style={{ backgroundColor: featured.panelBackgroundColor }}
        >
          <div className="max-w-lg space-y-8">
            <h2 className="text-4xl md:text-5xl leading-tight" style={{ fontFamily: titleFont }}>
              {headingLines.map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </h2>

            <div className="w-12 h-px bg-white/30"></div>

            <p
              className="text-sm md:text-base text-white/80 leading-relaxed"
              style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            >
              {featured.description}
            </p>

            <div className="pt-4">
              <Link href={featured.ctaHref || "/recetas"}>
                <button
                  type="button"
                  className="px-8 py-3.5 text-xs font-sans font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-90"
                  style={{
                    backgroundColor: featured.buttonBackgroundColor,
                    color: featured.buttonTextColor,
                  }}
                >
                  {featured.ctaText}
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
