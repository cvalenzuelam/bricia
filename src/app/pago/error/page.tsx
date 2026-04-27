"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";

export default function PagoErrorPage() {
  return (
    <div className="min-h-screen bg-brand-secondary flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle size={40} className="text-red-400" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-serif text-brand-primary">Algo salió mal</h1>
          <p className="text-base font-serif italic text-brand-primary/60 leading-relaxed">
            No se pudo procesar tu pago. No se realizó ningún cargo a tu cuenta.
          </p>
        </div>

        <div className="w-12 h-px bg-brand-accent mx-auto opacity-40" />

        <p className="text-sm font-sans text-brand-muted">
          Puedes intentarlo de nuevo o contactarnos en{" "}
          <a href="mailto:hola@bricia.com" className="text-brand-accent hover:underline">
            hola@bricia.com
          </a>
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link href="/productos">
            <button className="bg-brand-primary text-brand-secondary px-8 py-3.5 rounded-xl text-xs font-sans font-bold tracking-[0.2em] uppercase hover:bg-brand-accent transition-colors">
              Volver a la tienda
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
