"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowLeft } from "lucide-react";

const products = [
  { name: "tabla de mezquite", price: "$850 MXN", image: "/images/products.png" },
  { name: "cuchara de olivo", price: "$220 MXN", image: "/images/products.png" },
  { name: "jarrón cerámica", price: "$1,200 MXN", image: "/images/products.png" },
  { name: "mantel lino crudo", price: "$650 MXN", image: "/images/products.png" },
  { name: "set de cuencos", price: "$1,800 MXN", image: "/images/products.png" },
];

export default function ProductosPage() {
  return (
    <article className="min-h-screen bg-brand-secondary pt-32 pb-20">
      {/* Editorial Header */}
      <div className="max-w-7xl mx-auto px-6 mb-24 flex flex-col items-center text-center space-y-8">
        <h1 className="text-6xl md:text-8xl font-serif text-brand-primary lowercase tracking-tighter">
          nuestra <span className="italic text-brand-accent">boutique</span>
        </h1>
        <div className="w-24 h-px bg-brand-accent opacity-30"></div>
        <p className="editorial-spacing text-brand-muted max-w-lg leading-relaxed">
          OBJETOS QUE ENVEJECEN CON NOSOTROS, LLENOS DE HISTORIA Y CALIDEZ.
        </p>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24 mb-32">
        {products.map((product, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="group cursor-pointer text-center space-y-8"
          >
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white shadow-sm border border-brand-primary/5">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button className="bg-brand-primary text-brand-secondary px-6 py-3 rounded-full text-xs font-bold tracking-[0.2em] transform translate-y-4 group-hover:translate-y-0 transition-transform">
                   AÑADIR AL RECUENTO
                 </button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-serif text-brand-primary lowercase">{product.name}</h4>
              <p className="editorial-spacing text-brand-muted">{product.price}</p>
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
