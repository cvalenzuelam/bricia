"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useState, useEffect, type CSSProperties } from "react";

interface HeroConfig {
  title: string;
  titleColor: string;
  titleFont: string;
  logo: string;
  logoColor: string;
  logoFont: string;
  tagline: string;
  taglineItalic: boolean;
  description: string;
  ctaText: string;
  collageImages: { src: string; alt: string }[];
  backgroundColor: string;
}

const FONT_MAP: Record<string, string> = {
  serif: "var(--font-playfair)",
  sans: "var(--font-inter)",
  aboreto: "var(--font-aboreto)",
};

const DEFAULT_BG = "#FAF9F4";

function hexToRgb(
  hex: string
): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return { r: 250, g: 249, b: 244 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function imageOverlayStyle(bgHex: string): CSSProperties {
  const { r, g, b } = hexToRgb(bgHex);
  return {
    background: [
      `linear-gradient(to top, rgba(${r},${g},${b},0.25) 0%, transparent 30%)`,
      `linear-gradient(to left, transparent 42%, rgba(${r},${g},${b},0.5) 72%, ${bgHex} 100%)`,
    ].join(", "),
  };
}

export default function Hero() {
  const [config, setConfig] = useState<HeroConfig | null>(null);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then(setConfig);
  }, []);

  if (!config) {
    return (
      <section
        className="min-h-screen md:min-h-[calc(62vw*1.12)]"
        style={{ backgroundColor: DEFAULT_BG }}
      />
    );
  }

  const heroImage =
    config.collageImages?.[0]?.src || "/images/hero-inicio-bricia.jpg";
  const heroImageAlt =
    config.collageImages?.[0]?.alt || "Foto principal de Bricia";

  const bg = config.backgroundColor || DEFAULT_BG;
  const overlayStyle = imageOverlayStyle(bg);
  const sectionMinH = "min-h-screen md:min-h-[calc(62vw*1.12)]";

  return (
    <section
      className={`relative ${sectionMinH} flex flex-col md:flex-row overflow-hidden`}
      style={{ backgroundColor: bg }}
    >
      {/* Texto — izquierda (móvil: arriba), columna más estrecha */}
      <div
        className={`relative w-full md:w-[38%] flex flex-col items-center justify-center px-8 md:px-10 lg:px-14 pb-16 pt-14 md:pt-5 md:pb-2 md:min-h-[calc(62vw*1.12)] text-center`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-lg w-full"
        >
          <div className="space-y-6 md:space-y-8 -translate-y-8 md:-translate-y-28 lg:-translate-y-36">
          <div className="space-y-4 md:space-y-6">
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
              className="block text-4xl md:text-5xl lg:text-6xl tracking-[0.2em]"
              style={{
                color: config.logoColor,
                fontFamily: FONT_MAP[config.logoFont] || FONT_MAP.aboreto,
              }}
            >
              {config.logo}
            </span>
          </div>

          <div className="space-y-4 md:space-y-6">
            <p
              className="text-base md:text-lg font-serif leading-relaxed text-brand-primary/85"
              style={{
                fontStyle: config.taglineItalic ? "italic" : "normal",
              }}
            >
              {config.tagline}
            </p>
            <p className="hidden md:block text-sm font-sans text-brand-muted leading-relaxed">
              {config.description}
            </p>
            <p className="text-xs font-sans tracking-[0.2em] md:tracking-[0.25em] uppercase font-medium text-brand-accent">
              {config.ctaText}
            </p>
          </div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="hidden md:block pt-4 text-brand-primary/20"
          >
            <ArrowDown size={28} strokeWidth={1} className="mx-auto" />
          </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Foto — derecha (móvil: debajo del texto), columna más ancha */}
      <div
        className={`relative w-full md:w-[62%] aspect-[5/4] md:aspect-auto min-h-[48svh] md:min-h-[calc(62vw*1.12)] overflow-hidden`}
      >
        <Image
          src={heroImage}
          alt={heroImageAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 62vw"
          quality={92}
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={overlayStyle}
        />
      </div>
    </section>
  );
}
