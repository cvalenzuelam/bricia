"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useState, useEffect } from "react";

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

export default function Hero() {
  const [config, setConfig] = useState<HeroConfig | null>(null);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then(setConfig);
  }, []);

  if (!config) {
    return <section className="min-h-screen bg-brand-secondary" />;
  }

  const gridSizes = [
    "col-span-1 row-span-2",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
  ];

  return (
    <section
      className="relative min-h-screen flex flex-col md:flex-row overflow-hidden"
      style={{ backgroundColor: config.backgroundColor }}
    >
      {/* Left Column: Text Content */}
      <div className="w-full md:w-[45%] flex flex-col justify-center items-center px-8 md:px-16 pt-16 pb-6 md:py-0 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-md space-y-6 md:space-y-10"
        >
          <div className="space-y-6">
            <h1
              className="text-2xl md:text-3xl leading-tight mb-8"
              style={{
                color: config.titleColor,
                fontFamily: FONT_MAP[config.titleFont] || FONT_MAP.serif,
              }}
            >
              {config.title}
            </h1>
            <span
              className="hidden md:block text-5xl md:text-6xl tracking-[0.2em] mt-0"
              style={{
                color: config.logoColor,
                fontFamily: FONT_MAP[config.logoFont] || FONT_MAP.aboreto,
              }}
            >
              {config.logo}
            </span>
          </div>

          <div className="space-y-6">
            <p
              className="text-base font-serif leading-relaxed whitespace-normal md:whitespace-nowrap px-4 md:px-0"
              style={{
                color: config.titleColor + "cc",
                fontStyle: config.taglineItalic ? "italic" : "normal",
              }}
            >
              {config.tagline}
            </p>
            <p className="hidden md:block text-sm font-sans text-brand-muted leading-relaxed">
              {config.description}
            </p>
            <p className="text-xs font-sans text-brand-accent tracking-widest uppercase font-medium">
              {config.ctaText}
            </p>
          </div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="hidden md:block pt-6 text-brand-primary/20"
          >
            <ArrowDown size={28} strokeWidth={1} className="mx-auto" />
          </motion.div>
        </motion.div>
      </div>

      {/* Right Column: Photo Mosaic */}
      <div className="w-full md:w-[55%] h-[70vh] md:h-screen grid grid-cols-3 grid-rows-2 gap-1.5 p-1.5">
        {config.collageImages.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
            className={`relative overflow-hidden rounded-lg ${gridSizes[i] || ""}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              priority={i < 3}
              sizes="(max-width: 768px) 33vw, 20vw"
              className="object-cover hover:scale-105 transition-transform duration-[1.5s] ease-out"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
