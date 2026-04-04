"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const stories = [
  { title: "El Aroma de Mi Abuela", date: "24 de Mar, 2026", type: "CUENTO", excerpt: "Hay olores que te transportan a la infancia en un segundo..." },
  { title: "Conversación en la Cocina", date: "15 de Mar, 2026", type: "PODCAST", excerpt: "Sobre la importancia de las sobremesas largas..." },
  { title: "Tesoros de Oaxaca", date: "02 de Mar, 2026", type: "VIDEO", excerpt: "Un recorrido por los mercados locales buscando el ingrediente perfecto..." },
];

export default function StorySection() {
  return (
    <section className="bg-brand-primary text-brand-secondary py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <span className="editorial-spacing text-brand-accent">CUENTOS & HISTORIAS</span>
          <h2 className="text-4xl md:text-6xl font-serif tracking-tight">
            Más que Recetas,
            <br />
            <span className="italic text-brand-accent">un Pedazo de Vida</span>
          </h2>
        </div>

        <div className="space-y-0">
          {stories.map((story, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer border-b border-white/10 py-10 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-brand-accent uppercase">{story.type}</span>
                  <span className="text-[11px] font-sans text-white/30 tracking-widest">{story.date}</span>
                </div>
                <h4 className="text-2xl md:text-3xl font-serif group-hover:text-brand-accent transition-colors duration-300">
                  {story.title}
                </h4>
                <p className="text-sm font-sans text-white/50 max-w-md">{story.excerpt}</p>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] font-sans font-bold tracking-[0.3em] text-white/40 group-hover:text-white transition-colors uppercase shrink-0">
                LEER <ArrowRight size={14} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/cuentos">
            <button className="border border-white/20 px-10 py-4 text-[10px] font-sans font-bold tracking-[0.3em] uppercase hover:bg-brand-accent hover:text-brand-primary hover:border-brand-accent transition-all duration-500 rounded-full">
              Ver Todas las Historias
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
