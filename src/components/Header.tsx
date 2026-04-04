"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      (r) =>
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
                className="editorial-spacing text-brand-primary/80 hover:text-brand-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Trigger */}
          <button
            className="md:hidden text-brand-primary"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <div className="flex justify-center">
            <Link
              href="/"
              className="text-3xl tracking-[0.3em] text-brand-primary uppercase"
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
                  className="editorial-spacing text-brand-primary/80 hover:text-brand-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="text-brand-primary hover:text-brand-accent transition-colors"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
              <Link
                href="/cart"
                className="text-brand-primary hover:text-brand-accent transition-colors relative"
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-accent rounded-full border border-brand-secondary"></span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "100vh" }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-full left-0 w-full bg-brand-secondary flex flex-col items-center pt-20 px-6 gap-8 overflow-hidden z-40"
            >
              {[...leftLinks, ...rightLinks].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-2xl font-serif lowercase tracking-wide text-brand-primary"
                >
                  {link.name}
                </Link>
              ))}
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
