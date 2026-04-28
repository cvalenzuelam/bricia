"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { MesaArticle } from "@/data/lamesa";
import { notFound } from "next/navigation";
import Image from "next/image";

export default function LaMesaArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [article, setArticle] = useState<MesaArticle | null>(null);
  const [allArticles, setAllArticles] = useState<MesaArticle[]>([]);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    fetch("/api/mesa", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: MesaArticle[]) => {
        if (!Array.isArray(data)) { setNotFoundFlag(true); return; }
        setAllArticles(data);
        const found = data.find((a) => a.slug === resolvedParams.slug);
        if (!found) { setNotFoundFlag(true); return; }
        setArticle(found);
      });
  }, [resolvedParams.slug]);

  if (notFoundFlag) notFound();

  if (!article) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C2A878] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const idx = allArticles.findIndex((a) => a.slug === resolvedParams.slug);
  const prev = idx > 0 ? allArticles[idx - 1] : null;
  const next = idx < allArticles.length - 1 ? allArticles[idx + 1] : null;

  return (
    <article className="min-h-screen bg-[#FDFCF8] overflow-x-hidden">
      {/* ── PROGRESS BAR ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#C2A878] origin-left z-[45] mix-blend-multiply opacity-50"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, ease: "circOut" }}
      />

      {/* Encima del header del sitio (z-50): solo el enlace recibe clics */}
      <div className="fixed top-0 left-0 right-0 z-[55] p-6 md:p-8 flex justify-between items-center pointer-events-none">
        <Link
          href="/la-mesa"
          className="pointer-events-auto flex items-center gap-3 text-[10px] font-sans font-bold tracking-[0.3em] uppercase mix-blend-difference text-white hover:text-[#C2A878] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Volver
        </Link>
      </div>

      <header className="relative w-full h-[70vh] md:h-[90vh] bg-neutral-900 flex flex-col justify-end p-8 md:p-20 overflow-hidden">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          className="object-cover object-center opacity-40 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="relative max-w-5xl space-y-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4 text-white/80"
          >
            <span className="text-[10px] font-sans font-bold tracking-[0.4em] uppercase border border-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
              {article.type}
            </span>
            <span className="text-[10px] font-sans tracking-widest uppercase">{article.date}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-[7rem] font-serif text-white lowercase leading-[1.05] tracking-tight"
          >
            {article.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl md:text-2xl font-serif italic text-white/70 max-w-2xl font-light"
          >
            {article.excerpt}
          </motion.p>
        </div>
      </header>

      {/* ── BODY CONTENT ── */}
      <div className="max-w-4xl mx-auto px-6 py-24 md:py-32">
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-16"
          >
            <div className="flex items-center gap-4 text-[10px] font-sans text-brand-primary/40 uppercase tracking-[0.3em] pb-8 border-b border-[#C2A878]/30">
              <span><Home size={14} className="inline mr-2 text-[#C2A878]" /> La Mesa</span>
              <span>·</span>
              <span>{article.readingTime} de lectura</span>
            </div>

            {article.body.map((block, i) => {
              if (block.type === "paragraph") {
                return (
                  <p key={i} className="text-xl md:text-[22px] font-serif font-light leading-relaxed text-[#4A453E]">
                    {i === 0 && (
                      <span className="float-left text-7xl font-serif text-[#C2A878] leading-[0.8] pr-4 pt-4">
                        {block.text.charAt(0)}
                      </span>
                    )}
                    {i === 0 ? block.text.slice(1) : block.text}
                  </p>
                );
              }

              if (block.type === "image") {
                return (
                  <figure key={i} className="my-16 md:my-24">
                    <div className="relative w-full aspect-[4/3] md:aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-[#C2A878]/10">
                      <Image
                        src={block.url}
                        alt={block.alt}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-[2s] ease-out"
                      />
                    </div>
                    {block.caption && (
                      <figcaption className="mt-4 text-center text-xs font-sans text-brand-primary/40 tracking-wider">
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              }

              if (block.type === "quote") {
                return (
                  <blockquote key={i} className="my-16 md:my-20 relative py-8 px-6 md:px-12 border-l border-[#C2A878]/50">
                    <span className="absolute top-0 left-4 text-8xl font-serif text-[#C2A878]/20 leading-none">&ldquo;</span>
                    <p className="text-3xl md:text-5xl font-serif italic text-brand-primary leading-[1.3] tracking-tight relative z-10">
                      {block.text}
                    </p>
                    {block.author && (
                      <footer className="mt-8 flex items-center gap-4 text-xs font-sans font-bold tracking-[0.2em] uppercase text-brand-primary/50">
                        <span className="w-8 h-px bg-[#C2A878]" />
                        {block.author}
                      </footer>
                    )}
                  </blockquote>
                );
              }

              return null;
            })}
          </motion.div>
        </div>

        {/* ── AUTHOR ── */}
        <div className="mt-32 pt-16 border-t border-[#C2A878]/30 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[#EADFCE] flex items-center justify-center text-brand-primary font-serif italic text-2xl shadow-inner border border-white">
              B
            </div>
            <div>
              <p className="text-[12px] font-sans font-bold tracking-[0.2em] uppercase text-brand-primary">Bricia Elizalde</p>
              <p className="text-sm font-serif italic text-brand-primary/60">Arquitectura & Gastronomía</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PAGINATION ── */}
      <nav className="border-t border-[#C2A878]/20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2">
          {prev ? (
            <Link href={`/la-mesa/${prev.slug}`} className="group p-12 md:p-16 border-b md:border-b-0 md:border-r border-[#C2A878]/20 hover:bg-[#FDFCF8] transition-colors flex flex-col items-start gap-4 h-full relative overflow-hidden">
              <div className="absolute inset-0 bg-[#C2A878]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <span className="relative z-10 text-[10px] font-sans text-brand-primary/40 uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-[#C2A878] transition-colors"><ArrowLeft size={14} /> Historia Anterior</span>
              <span className="relative z-10 text-3xl md:text-4xl font-serif text-brand-primary lowercase leading-tight group-hover:text-[#C2A878] transition-colors max-w-sm">{prev.title}</span>
            </Link>
          ) : (
            <div className="hidden md:block p-16 border-r border-[#C2A878]/20" />
          )}

          {next ? (
            <Link href={`/la-mesa/${next.slug}`} className="group p-12 md:p-16 hover:bg-[#FDFCF8] transition-colors flex flex-col items-end text-right gap-4 h-full relative overflow-hidden">
              <div className="absolute inset-0 bg-[#C2A878]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <span className="relative z-10 text-[10px] font-sans text-brand-primary/40 uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-[#C2A878] transition-colors">Siguiente Historia <ArrowRight size={14} /></span>
              <span className="relative z-10 text-3xl md:text-4xl font-serif text-brand-primary lowercase leading-tight group-hover:text-[#C2A878] transition-colors max-w-sm">{next.title}</span>
            </Link>
          ) : (
            <div className="hidden md:block p-16" />
          )}
        </div>
      </nav>
    </article>
  );
}
