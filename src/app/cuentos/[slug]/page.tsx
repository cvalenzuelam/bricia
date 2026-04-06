"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { getStoryBySlug, stories } from "@/data/stories";

interface Props {
  params: { slug: string };
}

export default function StoryPage({ params }: Props) {
  const story = getStoryBySlug(params.slug);
  if (!story) return notFound();

  // Find prev/next
  const idx = stories.findIndex((s) => s.slug === params.slug);
  const prev = idx > 0 ? stories[idx - 1] : null;
  const next = idx < stories.length - 1 ? stories[idx + 1] : null;

  return (
    <article className="min-h-screen bg-brand-secondary">

      {/* ── HERO ── */}
      <div
        className={`relative pt-40 pb-32 px-6 bg-gradient-to-br ${story.coverColor}`}
      >
        {/* Subtle texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative max-w-3xl mx-auto space-y-8">
          {/* Back */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/cuentos"
              className="inline-flex items-center gap-2 text-[9px] font-sans font-bold tracking-[0.35em] uppercase text-white/40 hover:text-white/70 transition-colors"
            >
              <ArrowLeft size={12} strokeWidth={1.5} />
              Todos los relatos
            </Link>
          </motion.div>

          {/* Meta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-5 flex-wrap"
          >
            <span
              className="text-[9px] font-sans font-bold tracking-[0.4em] uppercase px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "rgba(176,141,87,0.2)",
                color: "#D4B07A",
              }}
            >
              {story.type}
            </span>
            <span className="text-[9px] font-sans text-white/40 tracking-widest uppercase">
              {story.date}
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-sans text-white/30">
              <Clock size={10} strokeWidth={1.5} />
              {story.readingTime} de lectura
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="text-5xl md:text-7xl font-serif text-white/95 lowercase leading-[1.05] tracking-tight"
          >
            {story.title}
          </motion.h1>

          {/* Excerpt */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl font-serif italic text-white/55 leading-relaxed max-w-xl"
          >
            {story.excerpt}
          </motion.p>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28 space-y-8">
        {story.body.map((para, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.6 }}
            className={
              i === 0
                ? "text-xl md:text-2xl font-serif text-brand-primary leading-relaxed first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-2 first-letter:leading-none first-letter:text-brand-accent"
                : "text-lg font-sans text-brand-primary/75 leading-loose"
            }
          >
            {para}
          </motion.p>
        ))}

        {/* Signature */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="pt-12 space-y-4 text-center"
        >
          <div className="w-16 h-px bg-brand-accent/25 mx-auto" />
          <p className="text-[10px] font-sans font-bold tracking-[0.4em] text-brand-muted uppercase">
            Bricia Elizalde — {story.date}
          </p>
        </motion.div>
      </div>

      {/* ── PREV / NEXT ── */}
      {(prev || next) && (
        <div className="max-w-4xl mx-auto px-6 pb-24 grid sm:grid-cols-2 gap-4 border-t border-brand-primary/5 pt-16">
          {prev ? (
            <Link href={`/cuentos/${prev.slug}`}>
              <div className="group p-6 rounded-2xl border border-brand-primary/5 hover:border-brand-accent/20 hover:shadow-md transition-all duration-300 cursor-pointer space-y-2">
                <p className="text-[9px] font-sans font-bold tracking-[0.3em] text-brand-muted uppercase">
                  ← Anterior
                </p>
                <p className="font-serif text-brand-primary group-hover:text-brand-accent transition-colors text-lg lowercase leading-tight">
                  {prev.title}
                </p>
              </div>
            </Link>
          ) : <div />}

          {next ? (
            <Link href={`/cuentos/${next.slug}`}>
              <div className="group p-6 rounded-2xl border border-brand-primary/5 hover:border-brand-accent/20 hover:shadow-md transition-all duration-300 cursor-pointer space-y-2 text-right">
                <p className="text-[9px] font-sans font-bold tracking-[0.3em] text-brand-muted uppercase">
                  Siguiente →
                </p>
                <p className="font-serif text-brand-primary group-hover:text-brand-accent transition-colors text-lg lowercase leading-tight">
                  {next.title}
                </p>
              </div>
            </Link>
          ) : <div />}
        </div>
      )}
    </article>
  );
}
