"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function PagoPendientePage() {
  return (
    <div className="min-h-screen bg-brand-secondary flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
            <Clock size={40} className="text-amber-500" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-serif text-brand-primary">Pago en proceso</h1>
          <p className="text-base font-serif italic text-brand-primary/60 leading-relaxed">
            Tu pago está siendo procesado. Te notificaremos por correo en cuanto se confirme.
          </p>
        </div>

        <div className="w-12 h-px bg-brand-accent mx-auto opacity-40" />

        <p className="text-sm font-sans text-brand-muted">
          Si pagaste en efectivo o por transferencia, puede tomar hasta 48 horas hábiles en confirmarse.
          Cualquier duda escríbenos a{" "}
          <a href="mailto:hola@bricia.com" className="text-brand-accent hover:underline">
            hola@bricia.com
          </a>
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link href="/productos">
            <button className="bg-brand-primary text-brand-secondary px-8 py-3.5 rounded-xl text-xs font-sans font-bold tracking-[0.2em] uppercase hover:bg-brand-accent transition-colors">
              Seguir explorando
            </button>
          </Link>
          <Link href="/" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors">
            Ir al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
