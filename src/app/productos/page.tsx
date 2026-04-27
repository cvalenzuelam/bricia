"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check } from "lucide-react";
import { products, formatPrice } from "@/data/products";
import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

const CATEGORIES = ["TODOS", "COCINA", "MESA", "DESPENSA"] as const;
type FilterCategory = typeof CATEGORIES[number];

function AddButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <button
      onClick={handleAdd}
      className={`w-full py-3.5 rounded-xl text-[10px] font-sans font-bold tracking-[0.2em] uppercase transition-all duration-500 flex items-center justify-center gap-2 ${
        added
          ? "bg-green-600 text-white"
          : "bg-brand-primary text-brand-secondary hover:bg-brand-accent"
      }`}
    >
      <AnimatePresence mode="wait">
        {added ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Check size={13} /> Agregado
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <ShoppingBag size={13} strokeWidth={1.5} /> Agregar
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function ProductosPage() {
  const [filter, setFilter] = useState<FilterCategory>("TODOS");

  const filtered = filter === "TODOS"
    ? products
    : products.filter((p) => p.category === filter);

  return (
    <article className="min-h-screen bg-brand-secondary pt-32 pb-32">
      {/* ── EDITORIAL HEADER ── */}
      <div className="max-w-7xl mx-auto px-6 mb-20 flex flex-col items-center text-center space-y-8">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="editorial-spacing text-brand-accent"
        >
          Objetos con alma para tu mesa
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-6xl md:text-8xl font-serif text-brand-primary lowercase tracking-tighter"
        >
          nuestra <span className="italic text-brand-accent">alacena</span>
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-16 h-px bg-brand-accent opacity-40 origin-center"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base md:text-lg font-serif italic text-brand-primary/60 max-w-xl leading-relaxed"
        >
          Herramientas, textiles y despensa seleccionados para inspirar cada momento en la cocina y alrededor de la mesa.
        </motion.p>
      </div>

      {/* ── FILTER ── */}
      <div className="max-w-7xl mx-auto px-6 mb-16 flex justify-center">
        <div className="flex gap-2 flex-wrap justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
                filter === cat
                  ? "bg-brand-primary text-brand-secondary"
                  : "border border-brand-primary/10 text-brand-muted hover:border-brand-accent/40 hover:text-brand-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group flex flex-col gap-6"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-brand-primary/5 shadow-sm">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
                  />
                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <span className="text-[9px] font-sans font-bold tracking-[0.25em] uppercase bg-white/90 backdrop-blur-sm text-brand-primary/60 px-3 py-1.5 rounded-full">
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-serif text-2xl md:text-3xl text-brand-primary lowercase leading-tight group-hover:text-brand-accent transition-colors duration-400">
                      {product.name}
                    </h3>
                    <p className="text-xs font-sans text-brand-muted">{product.subtitle}</p>
                  </div>

                  <p className="text-sm font-serif italic text-brand-primary/60 leading-relaxed line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-serif text-2xl text-brand-primary">
                      {formatPrice(product.price)}
                    </span>
                    {product.stock <= 3 && (
                      <span className="text-[9px] font-sans text-brand-accent border border-brand-accent/30 rounded-full px-2.5 py-1 tracking-[0.15em] uppercase">
                        Últimas {product.stock}
                      </span>
                    )}
                  </div>

                  <AddButton product={product} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-32">
            <p className="font-serif text-2xl italic text-brand-primary/30">
              No hay productos en esta categoría aún.
            </p>
          </div>
        )}
      </div>

      {/* ── NOTA ARTESANAL ── */}
      <div className="max-w-3xl mx-auto px-6 mt-32 text-center space-y-4">
        <div className="w-12 h-px bg-brand-accent mx-auto opacity-30" />
        <p className="text-sm font-serif italic text-brand-primary/50 leading-relaxed">
          Todos los objetos son producidos en pequeñas cantidades por artesanos y productores mexicanos. 
          Cuando se agoten, buscaremos la siguiente pieza que te mereces.
        </p>
      </div>
    </article>
  );
}
