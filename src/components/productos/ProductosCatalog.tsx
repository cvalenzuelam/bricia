"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
      className={`btn-solid w-full py-3.5 rounded-xl text-[10px] font-sans font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 ${
        added
          ? "!bg-green-600 !text-white hover:!bg-green-600 hover:!translate-y-0 hover:!shadow-none"
          : ""
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

export default function ProductosCatalog() {
  const [filter, setFilter] = useState("TODOS");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canCarouselPrev, setCanCarouselPrev] = useState(false);
  const [canCarouselNext, setCanCarouselNext] = useState(false);

  const syncCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanCarouselPrev(scrollLeft > 4);
    setCanCarouselNext(maxScroll > 4 && scrollLeft < maxScroll - 4);
  }, []);

  const scrollCarousel = useCallback((dir: -1 | 1) => {
    const el = carouselRef.current;
    if (!el) return;
    const stride = Math.min(el.clientWidth * 0.75, 360);
    el.scrollBy({ left: dir * stride, behavior: "smooth" });
  }, []);

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

  useEffect(() => {
    if (loading) return;
    const el = carouselRef.current;
    if (!el) return;
    syncCarouselScroll();
    const ro = new ResizeObserver(syncCarouselScroll);
    ro.observe(el);
    el.addEventListener("scroll", syncCarouselScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", syncCarouselScroll);
    };
  }, [loading, filtered.length, filter, syncCarouselScroll]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    queueMicrotask(syncCarouselScroll);
  }, [filter, syncCarouselScroll]);

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
              className={`chip-btn px-5 py-2 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] uppercase ${
                filter === cat
                  ? "bg-brand-primary text-brand-secondary shadow-[0_8px_20px_-10px_rgba(29,29,27,0.45)]"
                  : "border border-brand-primary/10 text-brand-muted hover:border-brand-accent/50 hover:text-brand-accent hover:bg-brand-accent/[0.08]"
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
          <>
            {/* Móvil: carrusel (misma idea que ProductSection en la home) */}
            <div className="md:hidden relative -mx-1 px-1">
              <div
                ref={carouselRef}
                role="region"
                aria-roledescription="carrusel"
                aria-label="Productos de la alacena"
                className="no-scrollbar flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
              >
                {filtered.map((product, i) => (
                  <motion.article
                    key={product.id}
                    id={`product-${product.id}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.35) }}
                    className="flex w-[min(78vw,280px)] flex-shrink-0 snap-start flex-col gap-5"
                  >
                    <Link
                      href={`/productos/${product.id}`}
                      className="group/image block relative aspect-[4/5] overflow-hidden rounded-2xl border border-brand-primary/10 bg-white shadow-sm"
                    >
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="280px"
                        quality={PHOTO_IMAGE_QUALITY}
                        className="object-cover transition-transform duration-[1.2s] ease-out group-hover/image:scale-105"
                      />
                      <ImageFrameFade variant="white" />
                      <div className="absolute top-3 left-3 z-[2]">
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-sans font-bold uppercase tracking-[0.2em] text-brand-primary/60 backdrop-blur-sm">
                          {product.category}
                        </span>
                      </div>
                    </Link>
                    <div className="flex flex-col gap-3 px-0.5">
                      <Link href={`/productos/${product.id}`} className="block">
                        <h3 className="font-serif text-xl leading-tight text-brand-primary transition-colors hover:text-brand-accent">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="line-clamp-2 text-xs font-serif italic text-brand-primary/55">
                        {product.description}
                      </p>
                      <span className="font-serif text-lg text-brand-primary">
                        {formatPrice(product.price)}
                      </span>
                      <AddButton product={product} />
                    </div>
                  </motion.article>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-10">
                <button
                  type="button"
                  aria-label="Productos anteriores"
                  onClick={() => scrollCarousel(-1)}
                  disabled={!canCarouselPrev}
                  className="carousel-btn flex h-12 w-12 items-center justify-center rounded-full border border-brand-primary/15 text-brand-accent hover:border-brand-accent/50 hover:bg-brand-accent/10 disabled:opacity-25"
                >
                  <ChevronLeft size={24} strokeWidth={1.5} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Siguientes productos"
                  onClick={() => scrollCarousel(1)}
                  disabled={!canCarouselNext}
                  className="carousel-btn flex h-12 w-12 items-center justify-center rounded-full border border-brand-primary/15 text-brand-accent hover:border-brand-accent/50 hover:bg-brand-accent/10 disabled:opacity-25"
                >
                  <ChevronRight size={24} strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            </div>

            <motion.div
              layout
              className="hidden grid-cols-1 gap-x-10 gap-y-20 md:grid md:grid-cols-2 lg:grid-cols-3 md:items-stretch"
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
                    className="group flex h-full flex-col gap-6"
                    id={`product-${product.id}-desktop`}
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

                    {/* Info: flex + mt-auto alinea precio y Agregar entre cards */}
                    <div className="flex flex-1 flex-col gap-4">
                      <div className="space-y-1">
                        <Link href={`/productos/${product.id}`} className="block">
                          <h3 className="font-serif text-2xl md:text-3xl text-brand-primary leading-tight line-clamp-2 min-h-[2.5em] md:min-h-[2.4em] group-hover:text-brand-accent transition-colors duration-400">
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

                      <div className="mt-auto space-y-4 pt-2">
                        <div>
                          <span className="font-serif text-2xl text-brand-primary">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <AddButton product={product} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
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
