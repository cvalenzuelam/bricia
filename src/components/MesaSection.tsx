"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ArticlePreview {
  slug: string;
  title: string;
  type: string;
  readingTime: string;
  excerpt: string;
}

interface MesaSectionProps {
  articles: ArticlePreview[];
}

export default function MesaSection({ articles }: MesaSectionProps) {
  const featuredArticles = articles.slice(0, 3);

  return (
    <section className="bg-brand-primary text-brand-secondary py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <span className="editorial-spacing text-brand-accent">INTERIORISMO & HOSTING</span>
          <h2 className="text-4xl md:text-6xl font-serif tracking-tight">
            El Arte de <span className="italic text-[#C2A878]">Recibir</span>
          </h2>
          <p className="text-sm font-sans text-brand-secondary/50 max-w-lg mx-auto pt-4">
            Descubre ideas, estéticas y secretos para que tu comedor y tu cocina sean los lugares favoritos de tus invitados.
          </p>
        </div>

        <div className="space-y-0 relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-brand-accent/0 via-brand-accent/30 to-brand-accent/0 hidden md:block"></div>
          {featuredArticles.map((article, i) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="group cursor-pointer border-b border-white/10 py-12 md:pl-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-[#C2A878] uppercase">{article.type}</span>
                  <span className="w-4 h-px bg-[#C2A878]/30"></span>
                  <span className="text-[11px] font-sans text-white/30 tracking-widest">{article.readingTime} de lectura</span>
                </div>
                <h4 className="text-2xl md:text-4xl font-serif group-hover:text-[#C2A878] transition-colors duration-400 lowercase leading-tight">
                  {article.title}
                </h4>
                <p className="text-sm font-serif italic text-white/50">{article.excerpt}</p>
              </div>

              <Link href={`/la-mesa/${article.slug}`} className="flex items-center justify-center w-12 h-12 rounded-full border border-white/20 text-[#C2A878] group-hover:bg-[#C2A878] group-hover:text-brand-primary group-hover:border-[#C2A878] transition-all duration-500 shrink-0">
                <ArrowRight size={16} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link href="/la-mesa">
            <button type="button" className="border border-white/20 px-10 py-4 text-[10px] font-sans font-bold tracking-[0.3em] uppercase hover:bg-[#C2A878] hover:text-brand-primary hover:border-[#C2A878] transition-all duration-500 rounded-full">
              Explorar La Mesa
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
