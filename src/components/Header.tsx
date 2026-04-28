"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { Recipe } from "@/data/recipes";
import type { MesaArticle } from "@/data/lamesa";
import type { Product } from "@/data/products";
import {
  searchSite,
  mixedSuggestions,
  type SiteSearchHit,
} from "@/lib/site-search";

const leftLinks = [
  { name: "RECETAS", href: "/recetas" },
  { name: "LA MESA", href: "/la-mesa" },
];

const rightLinks = [
  { name: "TIENDA", href: "/productos" },
  { name: "CONTACTO", href: "/contacto" },
];

function hitBadgeClass(kind: SiteSearchHit["kind"]): string {
  if (kind === "recipe") return "text-brand-accent";
  if (kind === "mesa") return "text-brand-primary/55";
  return "text-brand-muted";
}

export default function Header() {
  const { itemCount, openCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SiteSearchHit[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [articles, setArticles] = useState<MesaArticle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDarkPage = pathname === "/contacto";
  const isHome = pathname === "/";
  const textColor = scrolled ? "text-brand-primary" : (isDarkPage ? "text-white/90" : "text-brand-primary/80");
  const logoColor = scrolled ? "text-brand-primary" : (isDarkPage ? "text-white" : "text-brand-primary");
  const iconColor = scrolled ? "text-brand-primary" : (isDarkPage ? "text-white" : "text-brand-primary");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/recipes").then((r) => r.json()),
      fetch("/api/mesa").then((r) => r.json()),
      fetch("/api/productos").then((r) => r.json()),
    ])
      .then(([rRecipes, rMesa, rProducts]) => {
        if (cancelled) return;
        setRecipes(Array.isArray(rRecipes) ? rRecipes : []);
        setArticles(Array.isArray(rMesa) ? rMesa : []);
        setProducts(Array.isArray(rProducts) ? rProducts : []);
        setCatalogLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setCatalogLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const suggestions = useMemo(
    () => mixedSuggestions(recipes, articles, products, 6),
    [recipes, articles, products]
  );

  const runSearch = useCallback(
    (value: string) => {
      setQuery(value);
      const hits = searchSite(value, recipes, articles, products);
      setResults(hits);
    },
    [recipes, articles, products]
  );

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-brand-secondary/95 backdrop-blur-sm border-b border-brand-primary/5 py-4"
            : isDarkPage
              ? "bg-transparent py-8 border-b border-white/[0.06]"
              : isHome
                ? "bg-brand-secondary/90 backdrop-blur-md py-8 border-b border-brand-primary/[0.08]"
                : "bg-transparent py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-3 items-center">
          <nav className="hidden md:flex gap-10">
            {leftLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`editorial-spacing ${textColor} hover:text-brand-accent transition-colors`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <button
            className={`md:hidden ${iconColor} z-[70] relative`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex justify-center">
            <Link
              href="/"
              className={`text-3xl tracking-[0.3em] ${logoColor} uppercase`}
              style={{ fontFamily: "var(--font-aboreto)" }}
            >
              |BRICIA|
            </Link>
          </div>

          <div className="flex justify-end items-center gap-8">
            <nav className="hidden md:flex gap-10">
              {rightLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`editorial-spacing ${textColor} hover:text-brand-accent transition-colors`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className={`${iconColor} hover:text-brand-accent transition-colors`}
                aria-label="Abrir búsqueda"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={openCart}
                className={`${iconColor} hover:text-brand-accent transition-colors relative`}
                aria-label="Abrir carrito"
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-brand-accent text-white text-[9px] font-sans font-bold rounded-full flex items-center justify-center px-0.5 border border-brand-secondary"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-brand-secondary/98 backdrop-blur-md flex flex-col pt-32 pb-16 px-10"
            >
              <div className="max-w-md mx-auto w-full h-full flex flex-col justify-between items-center text-center">
                <nav className="flex flex-col space-y-10">
                  {[...leftLinks, ...rightLinks].map((link, idx) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: idx * 0.1,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="group block"
                      >
                        <span className="text-4xl xs:text-5xl font-serif text-brand-primary uppercase tracking-[0.1em] group-hover:text-brand-accent transition-all duration-500">
                          {link.name}
                        </span>
                        <div className="h-px w-0 group-hover:w-full bg-brand-accent/30 mx-auto mt-2 transition-all duration-500"></div>
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-6 pt-10 text-center"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-px bg-brand-accent/20"></div>
                    <p className="text-[10px] font-sans font-bold tracking-[0.4em] text-brand-muted uppercase">
                      Bricia Elizalde
                    </p>
                    <div className="flex gap-8">
                      <a href="#" className="text-brand-muted hover:text-brand-accent transition-colors editorial-spacing !text-[9px]">Instagram</a>
                      <a href="#" className="text-brand-muted hover:text-brand-accent transition-colors editorial-spacing !text-[9px]">TikTok</a>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Búsqueda en el sitio"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
              aria-hidden
            />

            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="relative w-full max-w-2xl mx-auto mt-28 bg-brand-secondary rounded-2xl shadow-2xl overflow-hidden border border-brand-primary/[0.06]"
            >
              <div className="flex items-center gap-4 px-8 py-6 border-b border-brand-primary/5">
                <Search size={20} strokeWidth={1.5} className="text-brand-accent shrink-0" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => runSearch(e.target.value)}
                  placeholder="Receta, mesa o alacena…"
                  autoComplete="off"
                  className="flex-1 bg-transparent text-xl font-serif text-brand-primary placeholder:text-brand-muted/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-brand-muted hover:text-brand-primary transition-colors"
                  aria-label="Cerrar búsqueda"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="px-8 pt-4 pb-0 text-[11px] font-sans text-brand-muted leading-relaxed">
                Busca por ingrediente, título de receta, tema de La Mesa o producto.
                Las coincidencias ignoran acentos — por ejemplo <span className="italic text-brand-primary/50">limon</span> encuentra limón.
              </p>

              <div className="max-h-[min(24rem,55vh)] overflow-y-auto">
                {query.replace(/\s/g, "").length >= 2 && results.length === 0 && catalogLoaded && (
                  <div className="px-8 py-10 text-center space-y-2">
                    <p className="text-brand-muted font-sans text-sm">
                      No encontramos nada con <span className="text-brand-primary font-medium">&ldquo;{query}&rdquo;</span>.
                    </p>
                    <p className="text-xs font-serif italic text-brand-primary/50">
                      Prueba una sola palabra, otro ingrediente o explora las rutas de abajo.
                    </p>
                  </div>
                )}

                {query.replace(/\s/g, "").length >= 2 &&
                  results.map((hit) => (
                    <Link
                      key={`${hit.kind}-${hit.href}`}
                      href={hit.href}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-5 px-8 py-4 hover:bg-brand-primary/[0.02] transition-colors group border-b border-brand-primary/[0.04] last:border-0"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-brand-primary/[0.04]">
                        <Image
                          src={hit.image}
                          alt={hit.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[9px] font-sans font-bold tracking-[0.25em] uppercase ${hitBadgeClass(hit.kind)}`}>
                          {hit.badge}
                        </p>
                        <p className="text-lg font-serif text-brand-primary group-hover:text-brand-accent transition-colors truncate lowercase">
                          {hit.title}
                        </p>
                        <p className="text-xs font-sans text-brand-muted truncate">
                          {hit.subtitle}
                        </p>
                      </div>
                      <div className="shrink-0 text-brand-primary/15 group-hover:text-brand-accent transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}

                {query.replace(/\s/g, "").length < 2 && catalogLoaded && (
                  <div className="px-8 py-6">
                    {suggestions.length > 0 ? (
                      <>
                        <p className="text-[10px] font-sans font-bold tracking-[0.28em] text-brand-muted uppercase mb-1">
                          Por el placer de curiosear
                        </p>
                        <p className="text-xs font-serif italic text-brand-primary/45 mb-5">
                          Un puñado de ideas cruzando recetas, mesa y tienda.
                        </p>
                        <div className="space-y-0">
                          {suggestions.map((hit) => (
                            <Link
                              key={`sug-${hit.kind}-${hit.href}`}
                              href={hit.href}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center gap-4 px-4 py-3.5 -mx-4 hover:bg-brand-primary/[0.03] rounded-xl transition-colors group"
                            >
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-brand-primary/[0.04]">
                                <Image
                                  src={hit.image}
                                  alt={hit.title}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[9px] font-sans font-bold tracking-[0.22em] uppercase ${hitBadgeClass(hit.kind)} mb-0.5`}>
                                  {hit.badge}
                                </p>
                                <p className="text-[15px] font-serif text-brand-primary group-hover:text-brand-accent transition-colors truncate lowercase">
                                  {hit.title}
                                </p>
                                <p className="text-[10px] font-sans text-brand-muted line-clamp-1 mt-0.5">
                                  {hit.subtitle}
                                </p>
                              </div>
                              <div className="shrink-0 text-brand-primary/10 group-hover:text-brand-accent transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm font-serif italic text-brand-primary/45 text-center py-4">
                        Escribe al menos dos letras para buscar en todo el sitio.
                      </p>
                    )}

                    <div className="mt-6 pt-5 border-t border-brand-primary/5 flex flex-wrap gap-x-5 gap-y-2 justify-center">
                      <Link href="/recetas" onClick={() => setSearchOpen(false)} className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted hover:text-brand-accent transition-colors">
                        Todas las recetas
                      </Link>
                      <span className="text-brand-primary/15">·</span>
                      <Link href="/la-mesa" onClick={() => setSearchOpen(false)} className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted hover:text-brand-accent transition-colors">
                        La mesa
                      </Link>
                      <span className="text-brand-primary/15">·</span>
                      <Link href="/productos" onClick={() => setSearchOpen(false)} className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted hover:text-brand-accent transition-colors">
                        Tienda
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
