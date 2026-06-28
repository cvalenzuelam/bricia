"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { HERO_IMAGE_QUALITY } from "@/lib/image-quality";

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
  collageImages: { src: string; alt: string }[];
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
  ctaText: "Descubre recetas inspiradoras cada semana",
  collageImages: [
    { src: "/images/hero-inicio-bricia.jpg", alt: "Bricia en picnic al aire libre" },
  ],
  backgroundColor: "#FAF9F4",
};

const DEFAULT_BG = "#FAF9F4";

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

function mergeHeroResponse(base: HeroConfig, patch: unknown): HeroConfig {
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
  const sectionMinH = "max-md:min-h-0 md:min-h-[calc(62vw*1.12)]";
  const { plain: titlePlain, highlight: titleHighlight } = resolveTitleParts(config);
  const eyebrow = config.eyebrow?.trim() || HERO_FALLBACK.eyebrow!;

  return (
    <section
      className={`relative ${sectionMinH} flex flex-col max-md:gap-0 max-md:pb-0 md:flex-row md:gap-0 overflow-hidden md:pb-0`}
      style={{ backgroundColor: bg }}
    >
      {/* Texto — izquierda */}
      <div
        className={`relative w-full md:w-[38%] flex flex-col max-md:px-8 md:px-10 lg:px-14 xl:px-16 max-md:pb-0 max-md:pt-[max(6.5rem,env(safe-area-inset-top,0px)+5rem)] md:py-12 md:min-h-[calc(62vw*1.12)] text-left`}
      >
        <div className="flex flex-1 flex-col justify-center max-w-xl w-full max-md:mx-auto md:max-w-none md:mx-0 md:-translate-y-16 lg:-translate-y-20">
          <div className="flex flex-col space-y-6 md:space-y-7">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-[13px] md:text-[14px] font-sans font-bold tracking-[0.45em] uppercase text-brand-accent"
            >
              {eyebrow}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif text-brand-primary tracking-tight leading-[1.05]"
            >
              <span className="block text-[2.8125rem] max-md:text-[3.4375rem] md:text-[3.3125rem] lg:text-[3.75rem] xl:text-[4.0625rem]">
                {titlePlain}
              </span>
              {titleHighlight ? (
                <span className="block text-[2.8125rem] max-md:text-[3.4375rem] md:text-[3.3125rem] lg:text-[3.75rem] xl:text-[4.0625rem] italic text-brand-accent mt-0.5">
                  {titleHighlight}
                </span>
              ) : null}
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-[4.375rem] h-px bg-brand-accent opacity-60 origin-left"
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-5 pt-1"
            >
              <p className="text-[17.5px] md:text-[18.75px] font-sans text-brand-primary leading-relaxed">
                {config.tagline}
              </p>
              {config.description ? (
                <p className="text-[17.5px] md:text-[18.75px] font-sans text-brand-primary leading-relaxed">
                  {config.description}
                </p>
              ) : null}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-2 md:pt-5"
            >
              <Link
                href="/recetas"
                className="inline-flex items-center gap-4 text-[13px] md:text-[14px] font-sans font-bold tracking-[0.35em] uppercase text-brand-accent transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary rounded-sm"
              >
                {config.ctaText}
                <ArrowRight size={20} strokeWidth={1.25} aria-hidden />
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.a
          href="#seccion-destacada"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="hidden md:inline-flex mt-auto pb-2 text-brand-primary/30 transition-colors hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary rounded-full"
          aria-label="Bajar a la sección destacada"
        >
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown size={30} strokeWidth={1} aria-hidden />
          </motion.span>
        </motion.a>
      </div>

      {/* Foto — derecha */}
      <div
        className={`relative z-[1] w-full md:w-[62%] aspect-[5/4] md:aspect-auto md:min-h-[calc(62vw*1.12)] overflow-hidden min-h-[42svh] max-md:min-h-0 max-md:isolate max-md:[transform:translateZ(0)] max-md:mx-0 max-md:mt-0 max-md:rounded-none md:rounded-none`}
        style={{ backgroundColor: bg }}
      >
        <Image
          src={heroImage}
          alt={heroImageAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 62vw"
          quality={HERO_IMAGE_QUALITY}
          className="object-cover object-center"
        />
      </div>
    </section>
  );
}
