"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

const stories = [
  { title: "el aroma de mi abuela", date: "24 de Mar, 2026", type: "CUENTO", excerpt: "Hay olores que te transportan a la infancia en un segundo. Para mí, es el de la canela recién molida en la cocina de mi abuela..." },
  { title: "conversación en la cocina", date: "15 de Mar, 2026", type: "PODCAST", excerpt: "En este episodio hablamos sobre la importancia de las sobremesas largas y el arte de escuchar mientras el café se cuela." },
  { title: "tesoros de oaxaca", date: "02 de Mar, 2026", type: "VIDEO", excerpt: "Un recorrido por los mercados locales buscando el ingrediente perfecto para mi próximo mole." },
];

export default function CuentosPage() {
  return (
    <article className="min-h-screen bg-brand-secondary pt-32 pb-20">
      {/* Editorial Header */}
      <div className="max-w-7xl mx-auto px-6 mb-24 flex flex-col items-center text-center space-y-8">
        <h1 className="text-6xl md:text-8xl font-serif text-brand-primary lowercase tracking-tighter">
          cuentos & <span className="italic text-brand-accent">historias</span>
        </h1>
        <div className="w-24 h-px bg-brand-accent opacity-30"></div>
        <p className="editorial-spacing text-brand-muted max-w-lg leading-relaxed">
          MÁS QUE ESCRITURA, UN PEDAZO DE VIDA EN CADA RELATO.
        </p>
      </div>

      {/* Feed Layout */}
      <div className="max-w-4xl mx-auto px-6 space-y-32 mb-32">
        {stories.map((story, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer border-b border-brand-primary/5 pb-20 space-y-6"
          >
            <div className="flex items-center gap-6">
              <span className="editorial-spacing text-brand-accent text-[8px] tracking-[0.4em]">{story.type}</span>
              <span className="text-[10px] font-sans font-medium text-brand-muted/40 uppercase tracking-widest">{story.date}</span>
            </div>
            <h4 className="text-4xl md:text-6xl font-serif text-brand-primary lowercase group-hover:text-brand-accent transition-colors leading-tight">
              {story.title}
            </h4>
            <p className="text-xl font-serif text-brand-primary/60 italic leading-relaxed max-w-2xl">
              {story.excerpt}
            </p>
            <div className="pt-6 flex items-center gap-2 editorial-spacing text-brand-primary/40 group-hover:text-brand-primary transition-colors">
              LEER EL RELATO <ArrowRight size={14} strokeWidth={1.5} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Final Signature Link */}
      <div className="text-center">
        <Link href="/" className="editorial-spacing hover:text-brand-accent transition-colors flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> VOLVER AL RECINTO
        </Link>
      </div>
    </article>
  );
}
