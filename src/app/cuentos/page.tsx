"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { stories } from "@/data/stories";

const typeColor: Record<string, string> = {
  CUENTO: "#B08D57",
  RELATO: "#8A7560",
  "REFLEXIÓN": "#C4A882",
};

export default function CuentosPage() {
  const [featured, ...rest] = stories;

  return (
    <article className="min-h-screen bg-brand-secondary">

      {/* ── EDITORIAL HEADER ── */}
      <div className="max-w-7xl mx-auto px-6 pt-40 pb-20 flex flex-col items-center text-center space-y-8">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[10px] font-sans font-bold tracking-[0.5em] uppercase text-brand-accent"
        >
          Escritura & Memoria
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-6xl md:text-8xl font-serif text-brand-primary lowercase tracking-tighter"
        >
          cuentos &{" "}
          <span className="italic text-brand-accent">historias</span>
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-24 h-px bg-brand-accent opacity-30 origin-left"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-sm font-sans text-brand-muted max-w-md leading-relaxed"
        >
          Más que escritura, un pedazo de vida en cada relato. Historias que
          nacen de la cocina, la mesa y los recuerdos que se quedan.
        </motion.p>
      </div>

      {/* ── FEATURED STORY ── */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <Link href={`/cuentos/${featured.slug}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className={`group relative rounded-3xl overflow-hidden bg-gradient-to-br ${featured.coverColor} p-10 md:p-16 cursor-pointer transition-transform duration-500 hover:scale-[1.01]`}
          >
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
            />
            <div className="relative max-w-3xl space-y-6">
              <div className="flex items-center gap-4">
                <span
                  className="text-[9px] font-sans font-bold tracking-[0.4em] uppercase px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: "rgba(176,141,87,0.2)", color: "#D4B07A" }}
                >
                  {featured.type}
                </span>
                <span className="text-[10px] font-sans text-white/40 tracking-widest uppercase">
                  {featured.date}
                </span>
                <span className="text-[10px] font-sans text-white/30">
                  · {featured.readingTime} lectura
                </span>
              </div>
              <h2 className="text-4xl md:text-6xl font-serif text-white/95 lowercase leading-tight tracking-tight group-hover:text-brand-accent transition-colors duration-500">
                {featured.title}
              </h2>
              <p className="text-lg font-serif italic text-white/60 leading-relaxed max-w-2xl">
                {featured.excerpt}
              </p>
              <div className="pt-4 flex items-center gap-3 text-[10px] font-sans font-bold tracking-[0.3em] uppercase text-white/40 group-hover:text-brand-accent transition-colors duration-300">
                Leer el relato <ArrowRight size={14} strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* ── STORY GRID ── */}
      <div className="max-w-7xl mx-auto px-6 mb-32 grid md:grid-cols-2 gap-6">
        {rest.map((story, i) => (
          <Link key={story.slug} href={`/cuentos/${story.slug}`}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="group h-full border border-brand-primary/5 rounded-2xl p-8 md:p-10 bg-white hover:border-brand-accent/20 hover:shadow-lg transition-all duration-400 cursor-pointer flex flex-col gap-6"
            >
              {/* Top meta */}
              <div className="flex items-center gap-4">
                <span
                  className="text-[9px] font-sans font-bold tracking-[0.3em] uppercase"
                  style={{ color: typeColor[story.type] ?? "#B08D57" }}
                >
                  {story.type}
                </span>
                <span className="text-[9px] font-sans text-brand-muted/40 tracking-widest uppercase">
                  {story.date}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-3xl md:text-4xl font-serif text-brand-primary lowercase leading-tight tracking-tight group-hover:text-brand-accent transition-colors duration-400 flex-1">
                {story.title}
              </h3>

              {/* Excerpt */}
              <p className="text-sm font-serif italic text-brand-muted leading-relaxed">
                {story.excerpt}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-primary/5">
                <span className="text-[9px] font-sans text-brand-muted/40 tracking-widest">
                  {story.readingTime} de lectura
                </span>
                <div className="flex items-center gap-2 text-[9px] font-sans font-bold tracking-[0.25em] uppercase text-brand-muted/40 group-hover:text-brand-accent transition-colors duration-300">
                  Leer <ArrowRight size={12} strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* ── BOTTOM SIGNATURE ── */}
      <div className="text-center pb-20">
        <div className="w-12 h-px bg-brand-accent/20 mx-auto mb-8" />
        <p className="text-[10px] font-sans font-bold tracking-[0.4em] text-brand-muted uppercase">
          Bricia Elizalde
        </p>
      </div>
    </article>
  );
}
