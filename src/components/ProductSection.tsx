"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type JSX,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/data/products";

function formatPriceMx(price: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatProductTitle(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function ProductSection(): JSX.Element | null {
  const [products, setProducts] = useState<Product[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const syncScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanPrev(scrollLeft > 4);
    setCanNext(maxScroll > 4 && scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/productos", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data)) return;
        const parsed = data.filter((x): x is Product =>
          Boolean(x) &&
          typeof x === "object" &&
          typeof (x as Product).id === "string" &&
          typeof (x as Product).name === "string" &&
          typeof (x as Product).image === "string" &&
          typeof (x as Product).price === "number"
        );
        setProducts(parsed);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncScrollButtons();
    const ro = new ResizeObserver(syncScrollButtons);
    ro.observe(el);
    el.addEventListener("scroll", syncScrollButtons, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", syncScrollButtons);
    };
  }, [products.length, syncScrollButtons]);

  const scrollBySnap = useCallback((dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const stride = Math.min(el.clientWidth * 0.75, 360);
    el.scrollBy({ left: dir * stride, behavior: "smooth" });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="bg-brand-primary text-brand-secondary py-24 md:py-32 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-14 space-y-4">
          <span className="editorial-spacing text-[#C2A878] block">LA TIENDA</span>
          <h2 className="text-4xl md:text-6xl font-serif text-brand-secondary tracking-tight">
            Objetos con Alma
            <br />
            <span className="italic text-[#C2A878]">para Tu Mesa</span>
          </h2>
          <p className="text-sm font-sans text-brand-secondary/55 max-w-lg mx-auto pt-2 leading-relaxed">
            Descubre ideas, estéticas y secretos para que tu comedor y tu cocina sean los lugares
            favoritos de tus invitados.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Productos anteriores"
            onClick={() => scrollBySnap(-1)}
            disabled={!canPrev}
            className="hidden md:flex absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-3 lg:-translate-x-6 w-11 h-11 items-center justify-center rounded-full border border-white/20 bg-brand-primary/90 text-[#C2A878] shadow-lg backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/35 disabled:pointer-events-none disabled:opacity-20"
          >
            <ChevronLeft size={22} strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Siguientes productos"
            onClick={() => scrollBySnap(1)}
            disabled={!canNext}
            className="hidden md:flex absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-3 lg:translate-x-6 w-11 h-11 items-center justify-center rounded-full border border-white/20 bg-brand-primary/90 text-[#C2A878] shadow-lg backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/35 disabled:pointer-events-none disabled:opacity-20"
          >
            <ChevronRight size={22} strokeWidth={1.5} aria-hidden />
          </button>

          <div
            ref={scrollRef}
            role="region"
            aria-roledescription="carrusel"
            aria-label="Productos de la tienda"
            className="no-scrollbar flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 md:-mx-0 md:px-2"
          >
            {products.map((product, i) => (
              <Link
                key={product.id}
                href={`/productos/${product.id}`}
                className="group flex-shrink-0 snap-start w-[min(78vw,280px)] sm:w-[min(42vw,280px)] md:w-[min(31vw,300px)]"
              >
                <motion.article
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.45 }}
                  className="cursor-pointer space-y-5 h-full"
                >
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 300px"
                      className="object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                    />
                  </div>
                  <div className="text-center space-y-1.5 px-1">
                    <h3 className="text-lg font-serif text-brand-secondary group-hover:text-[#C2A878] transition-colors duration-300">
                      {formatProductTitle(product.name)}
                    </h3>
                    <p className="text-xs font-sans text-white/45 tracking-widest">
                      {formatPriceMx(product.price)}
                    </p>
                  </div>
                </motion.article>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-10 md:hidden">
            <button
              type="button"
              aria-label="Productos anteriores"
              onClick={() => scrollBySnap(-1)}
              disabled={!canPrev}
              className="flex w-12 h-12 items-center justify-center rounded-full border border-white/20 text-[#C2A878] disabled:opacity-25"
            >
              <ChevronLeft size={24} strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Siguientes productos"
              onClick={() => scrollBySnap(1)}
              disabled={!canNext}
              className="flex w-12 h-12 items-center justify-center rounded-full border border-white/20 text-[#C2A878] disabled:opacity-25"
            >
              <ChevronRight size={24} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/productos"
            className="inline-block border border-white/20 px-10 py-4 text-[10px] font-sans font-bold tracking-[0.3em] uppercase hover:bg-[#C2A878] hover:text-brand-primary hover:border-[#C2A878] transition-all duration-500 rounded-full"
          >
            Ver toda la tienda
          </Link>
        </div>
      </div>
    </section>
  );
}
