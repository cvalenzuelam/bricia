"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, Loader2 } from "lucide-react";
import { formatPrice } from "@/data/products";
import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { PHOTO_IMAGE_QUALITY } from "@/lib/image-quality";
import ImageFrameFade from "@/components/ImageFrameFade";

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
  const [filter, setFilter] = useState("TODOS");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/productos", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "TODOS",
    ...Array.from(new Set(products.map((p) => p.category?.trim()).filter(Boolean))),
  ];

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
          {categories.map((cat) => (
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
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={24} className="animate-spin text-brand-muted" />
          </div>
        ) : (
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
                  id={`product-${product.id}`}
                >
                  <Link
                    href={`/productos/${product.id}`}
                    className="block relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-brand-primary/5 shadow-sm group/image"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={PHOTO_IMAGE_QUALITY}
                      className="object-cover transition-transform duration-[1.4s] ease-out group-hover/image:scale-105"
                    />
                    <ImageFrameFade variant="white" />
                    {/* Category badge */}
                    <div className="absolute top-4 left-4 z-[2]">
                      <span className="text-[9px] font-sans font-bold tracking-[0.25em] uppercase bg-white/90 backdrop-blur-sm text-brand-primary/60 px-3 py-1.5 rounded-full">
                        {product.category}
                      </span>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Link href={`/productos/${product.id}`} className="block">
                        <h3 className="font-serif text-2xl md:text-3xl text-brand-primary leading-tight group-hover:text-brand-accent transition-colors duration-400">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs font-sans text-brand-muted">{product.subtitle}</p>
                    </div>

                    <p className="text-sm font-serif italic text-brand-primary/60 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>

                    <Link
                      href={`/productos/${product.id}`}
                      className="inline-block editorial-spacing text-brand-accent/90 hover:text-brand-primary transition-colors"
                    >
                      Ver pieza →
                    </Link>

                    <div className="pt-1">
                      <span className="font-serif text-2xl text-brand-primary">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <AddButton product={product} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && filtered.length === 0 && (
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
