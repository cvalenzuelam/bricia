"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { ShopConfig } from "@/data/shop-config";

type Props = {
  config: Pick<ShopConfig, "title" | "subtitle" | "message">;
  variant?: "page" | "section";
};

export default function ShopComingSoon({ config, variant = "page" }: Props) {
  const isPage = variant === "page";

  return (
    <article
      className={
        isPage
          ? "min-h-screen bg-brand-secondary pt-32 pb-32"
          : "bg-brand-primary text-brand-secondary py-24 md:py-32 px-6 border-t border-white/10"
      }
    >
      <div className={`mx-auto ${isPage ? "max-w-3xl px-6" : "max-w-7xl"}`}>
        {isPage && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <Link
              href="/"
              className="editorial-spacing inline-flex items-center gap-2 text-brand-primary/70 hover:text-brand-accent transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              Volver al inicio
            </Link>
          </motion.div>
        )}

        <div className={`flex flex-col items-center text-center ${isPage ? "space-y-10" : "space-y-8"}`}>
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`editorial-spacing block ${isPage ? "text-brand-accent" : "text-[#C2A878]"}`}
          >
            LA TIENDA
          </motion.span>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className={`relative flex items-center justify-center rounded-full border ${
              isPage
                ? "h-20 w-20 border-brand-accent/25 bg-white shadow-sm"
                : "h-16 w-16 border-white/15 bg-white/5"
            }`}
          >
            <Sparkles
              size={isPage ? 28 : 24}
              strokeWidth={1.25}
              className={isPage ? "text-brand-accent" : "text-[#C2A878]"}
              aria-hidden
            />
            <span
              className={`absolute inset-0 rounded-full animate-pulse ${
                isPage ? "bg-brand-accent/5" : "bg-[#C2A878]/10"
              }`}
              aria-hidden
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className={`font-serif lowercase tracking-tighter ${
              isPage
                ? "text-5xl md:text-7xl text-brand-primary"
                : "text-4xl md:text-6xl text-brand-secondary"
            }`}
          >
            {config.title.toLowerCase()}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className={`h-px origin-center ${isPage ? "w-16 bg-brand-accent/40" : "w-14 bg-[#C2A878]/50"}`}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`font-serif italic leading-relaxed ${
              isPage
                ? "text-xl md:text-2xl text-brand-primary/75 max-w-xl"
                : "text-lg md:text-xl text-brand-secondary/80 max-w-lg"
            }`}
          >
            {config.subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className={`font-sans leading-relaxed ${
              isPage
                ? "text-sm md:text-base text-brand-primary/55 max-w-md"
                : "text-sm text-brand-secondary/55 max-w-lg"
            }`}
          >
            {config.message}
          </motion.p>

          {isPage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="pt-6 flex flex-wrap justify-center gap-x-6 gap-y-3"
            >
              <Link
                href="/recetas"
                className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted hover:text-brand-accent transition-colors"
              >
                Explorar recetas
              </Link>
              <span className="text-brand-primary/15 hidden sm:inline" aria-hidden>
                ·
              </span>
              <Link
                href="/la-mesa"
                className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted hover:text-brand-accent transition-colors"
              >
                Leer La Mesa
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </article>
  );
}
