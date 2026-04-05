"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const leftLinks = [
  { name: "RECETAS", href: "/recetas" },
  { name: "CUENTOS", href: "/cuentos" },
];

const rightLinks = [
  { name: "TIENDA", href: "/productos" },
  { name: "CONTACTO", href: "/contacto" },
];

interface Recipe {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const isDarkPage = pathname === "/contacto";
  const textColor = scrolled ? "text-brand-primary" : (isDarkPage ? "text-white/90" : "text-brand-primary/80");
  const logoColor = scrolled ? "text-brand-primary" : (isDarkPage ? "text-white" : "text-brand-primary");
  const iconColor = scrolled ? "text-brand-primary" : (isDarkPage ? "text-white" : "text-brand-primary");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load recipes once for search
  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then(setAllRecipes)
      .catch(() => {});
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [searchOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const q = value.toLowerCase();
    const filtered = allRecipes.filter(
      (r: Recipe) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
    setResults(filtered);
  };

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-brand-secondary/95 backdrop-blur-sm border-b border-brand-primary/5 py-4"
            : "bg-transparent py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-3 items-center">
          {/* Left Links (Desktop) */}
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

          {/* Mobile Menu Trigger */}
          <button
            className={`md:hidden ${iconColor}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <div className="flex justify-center">
            <Link
              href="/"
              className={`text-3xl tracking-[0.3em] ${logoColor} uppercase`}
              style={{ fontFamily: "var(--font-aboreto)" }}
            >
              |BRICIA|
            </Link>
          </div>

          {/* Right Section */}
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
                onClick={() => setSearchOpen(true)}
                className={`${iconColor} hover:text-brand-accent transition-colors`}
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
              <Link
                href="/cart"
                className={`${iconColor} hover:text-brand-accent transition-colors relative`}
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-accent rounded-full border border-brand-secondary"></span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── MOBILE MENU OVERLAY (Editorial Design) ──────────────── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-brand-secondary flex flex-col pt-32 pb-16 px-10"
            >
              <div className="max-w-md mx-auto w-full h-full flex flex-col justify-between">
                {/* 1. Staggered Link List */}
                <nav className="flex flex-col space-y-12">
                  {[...leftLinks, ...rightLinks].map((link, idx) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: 0.1 + idx * 0.1,
                        ease: [0.22, 1, 0.36, 1] 
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="group flex items-baseline gap-6"
                      >
                        <span className="text-[10px] font-sans font-bold tracking-[0.4em] text-brand-accent/50 group-hover:text-brand-accent transition-colors">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-4xl xs:text-5xl font-serif text-brand-primary lowercase tracking-tight group-hover:text-brand-accent transition-all duration-500">
                          {link.name}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* 2. Menu Bottom Signature / Socials */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="space-y-10 pt-10 border-t border-brand-primary/5"
                >
                  <div className="flex justify-between items-center">
                    <p className="editorial-spacing text-brand-muted opacity-60">
                      bricia elizalde &copy; 2024
                    </p>
                    <div className="flex gap-6">
                      <a href="https://instagram.com/briciaelizalde" target="_blank" className="text-brand-muted hover:text-brand-accent transition-colors">
                        <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">IG</span>
                      </a>
                      <a href="https://tiktok.com/@bricia.elizalde" target="_blank" className="text-brand-muted hover:text-brand-accent transition-colors">
                        <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">TK</span>
                      </a>
                    </div>
                  </div>
                  
                  <p className="text-[12px] font-serif italic text-brand-accent opacity-80 leading-loose">
                    Cocina con amor, historias que alimentan el alma.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── SEARCH OVERLAY ──────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex flex-col"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />

            {/* Search panel */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="relative w-full max-w-2xl mx-auto mt-28 bg-brand-secondary rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Search input */}
              <div className="flex items-center gap-4 px-8 py-6 border-b border-brand-primary/5">
                <Search size={20} strokeWidth={1.5} className="text-brand-accent shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar recetas..."
                  className="flex-1 bg-transparent text-xl font-serif text-brand-primary placeholder:text-brand-muted/40 focus:outline-none"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-brand-muted hover:text-brand-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Results / Empty state */}
              <div className="max-h-80 overflow-y-auto">
                {query.length >= 2 && results.length === 0 && (
                  <div className="px-8 py-12 text-center">
                    <p className="text-brand-muted font-sans text-sm">
                      No encontramos recetas con &ldquo;{query}&rdquo;
                    </p>
                  </div>
                )}

                {results.map((recipe) => (
                  <Link
                    key={recipe.slug}
                    href={`/recetas/${recipe.slug}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-5 px-8 py-4 hover:bg-brand-primary/[0.02] transition-colors group"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={recipe.image}
                        alt={recipe.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-sans font-bold tracking-[0.25em] text-brand-accent uppercase">
                        {recipe.category}
                      </p>
                      <p className="text-lg font-serif text-brand-primary group-hover:text-brand-accent transition-colors truncate">
                        {recipe.title}
                      </p>
                      <p className="text-xs font-sans text-brand-muted truncate">
                        {recipe.subtitle}
                      </p>
                    </div>
                  </Link>
                ))}

                {query.length < 2 && allRecipes.length > 0 && (
                  <div className="px-8 py-6">
                    <p className="text-[10px] font-sans font-bold tracking-[0.2em] text-brand-muted uppercase mb-4">
                      Sugerencias para ti
                    </p>
                    <div className="space-y-1">
                      {allRecipes.slice(0, 3).map((recipe) => (
                        <Link
                          key={`sug-${recipe.slug}`}
                          href={`/recetas/${recipe.slug}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-4 px-4 py-3 -mx-4 hover:bg-brand-primary/[0.03] rounded-xl transition-colors group"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={recipe.image}
                              alt={recipe.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-serif text-brand-primary group-hover:text-brand-accent transition-colors truncate">
                              {recipe.title}
                            </p>
                            <p className="text-[9px] font-sans text-brand-muted uppercase tracking-[0.2em] truncate mt-0.5">
                              {recipe.category}
                            </p>
                          </div>
                          <div className="shrink-0 text-brand-primary/10 group-hover:text-brand-accent transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      ))}
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
