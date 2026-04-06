"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { mesaArticles } from "@/data/lamesa";
import Image from "next/image";

const typeColor: Record<string, string> = {
  MESA: "#A89F91",
  ILUMINACIÓN: "#C2A878",
  HOSTING: "#B5A18C",
  ESTÉTICA: "#C0B2A3",
};

export default function LaMesaPage() {
  const [featured, ...rest] = mesaArticles;

  return (
    <article className="min-h-screen bg-[#FDFCF8]">
      {/* ── EDITORIAL HEADER ── */}
      <div className="max-w-7xl mx-auto px-6 pt-40 pb-24 flex flex-col items-center text-center space-y-10">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[11px] font-sans font-bold tracking-[0.5em] uppercase text-[#A89F91]"
        >
          Decoración & Hosting
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-6xl md:text-8xl lg:text-[7rem] font-serif text-brand-primary lowercase tracking-tighter"
        >
          la <span className="italic text-[#C2A878]">mesa</span>
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-16 h-px bg-[#C2A878] opacity-50 origin-center"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base md:text-lg font-serif italic text-brand-primary/60 max-w-xl leading-relaxed"
        >
          Todo lo que rodea el acto de cocinar y compartir. El espacio, la luz, el diseño y el arte de hacer que tus invitados no se quieran ir.
        </motion.p>
      </div>

      {/* ── FEATURED ARTICLE ── */}
      <div className="max-w-7xl mx-auto px-6 mb-28">
        <Link href={`/la-mesa/${featured.slug}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className={`group relative rounded-[2rem] overflow-hidden p-12 md:p-20 cursor-pointer transition-all duration-700 hover:shadow-2xl hover:shadow-[#C2A878]/20 bg-neutral-900`}
          >
            <Image 
              src={featured.coverImage}
              alt={featured.title}
              fill
              className="object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-[2s] ease-out"
              priority
            />
            {/* Texture overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative max-w-3xl space-y-8">
              <div className="flex items-center gap-5">
                <span
                  className="text-[10px] font-sans font-bold tracking-[0.4em] uppercase px-4 py-2 rounded-full border border-white/20 text-white/80 backdrop-blur-sm"
                >
                  {featured.type}
                </span>
                <span className="text-[10px] font-sans text-white/50 tracking-widest uppercase">
                  {featured.date}
                </span>
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white lowercase leading-[1.1] tracking-tight group-hover:text-[#C2A878] transition-colors duration-500">
                {featured.title}
              </h2>
              <p className="text-xl font-serif italic text-white/80 leading-relaxed max-w-2xl">
                {featured.excerpt}
              </p>
              <div className="pt-6 flex items-center gap-3 text-[11px] font-sans font-bold tracking-[0.3em] uppercase text-white/60 group-hover:text-[#C2A878] transition-colors duration-300">
                Adentrarse al espacio <ArrowRight size={16} strokeWidth={1.5} className="group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* ── ARTICLES GRID (Design Focus) ── */}
      <div className="max-w-7xl mx-auto px-6 mb-40">
        <div className="grid md:grid-cols-12 gap-8 md:gap-12">
          {rest.map((article, i) => (
            <Link 
              key={article.slug} 
              href={`/la-mesa/${article.slug}`}
              className={`group ${i % 3 === 0 ? 'md:col-span-12' : 'md:col-span-6'}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className={`h-full flex flex-col ${i % 3 === 0 ? 'md:flex-row md:items-center gap-12' : 'gap-8'}`}
              >
                {/* Visual Block with real image */}
                <div className={`rounded-3xl overflow-hidden relative group-hover:shadow-2xl transition-all duration-700 ${i % 3 === 0 ? 'md:w-1/2 aspect-square md:aspect-[4/3]' : 'w-full aspect-[4/3]'}`}>
                    <Image 
                      src={article.coverImage} 
                      alt={article.title} 
                      fill 
                      className="object-cover transform group-hover:scale-105 transition-transform duration-[1.5s] ease-out" 
                    />
                    {/* Inner styling overlay */}
                    <div className="absolute inset-x-8 bottom-8 flex justify-between items-end opacity-0 group-hover:opacity-40 transition-opacity duration-700">
                         <div className="w-1/2 h-px bg-white"></div>
                         <div className="w-4 h-4 rounded-full border border-white"></div>
                    </div>
                </div>

                <div className={`flex flex-col gap-6 ${i % 3 === 0 ? 'md:w-1/2 md:py-10' : 'flex-1'}`}>
                  {/* Top meta */}
                  <div className="flex items-center gap-4">
                    <span
                      className="text-[10px] font-sans font-bold tracking-[0.3em] uppercase"
                      style={{ color: typeColor[article.type] ?? "#A89F91" }}
                    >
                      {article.type}
                    </span>
                    <span className="text-[10px] font-sans text-brand-muted/40 tracking-widest uppercase">
                      {article.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl md:text-5xl font-serif text-brand-primary lowercase leading-[1.1] tracking-tight group-hover:text-[#C2A878] transition-colors duration-400">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-base font-serif italic text-brand-primary/60 leading-relaxed font-light">
                    {article.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="mt-auto pt-6 flex items-center gap-3 text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-brand-primary/40 group-hover:text-[#C2A878] transition-colors duration-300">
                    Saber más <ArrowRight size={14} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── BOTTOM SIGNATURE ── */}
      <div className="text-center pb-24">
        <div className="w-12 h-px bg-[#C2A878] mx-auto mb-10 opacity-30" />
        <p className="text-[11px] font-sans font-bold tracking-[0.4em] text-brand-primary/40 uppercase">
          Diseño Interior & Estilo de Vida
        </p>
      </div>
    </article>
  );
}
