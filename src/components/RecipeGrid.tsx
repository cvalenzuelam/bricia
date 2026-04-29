"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RecipeCard from "./RecipeCard";

interface Recipe {
  slug: string;
  title: string;
  category: string;
  image: string;
}

const SEASON_CATEGORIES = ["PRIMAVERA", "VERANO", "OTOÑO", "INVIERNO", "POSTRES"] as const;
const FILTER_ORDER = [...SEASON_CATEGORIES, "TODAS"] as const;
type SeasonOrAll = (typeof FILTER_ORDER)[number];

type ViewMode = "featured" | SeasonOrAll;

function pickLandingFeatured(all: Recipe[], slugs: string[]): Recipe[] {
  if (slugs.length === 0) {
    return all.length > 0 ? all.slice(0, 4) : [];
  }
  const bySlug = new Map(all.map((r) => [r.slug, r]));
  const ordered: Recipe[] = [];
  const seen = new Set<string>();
  for (const raw of slugs) {
    const s = typeof raw === "string" ? raw.trim() : "";
    if (!s || seen.has(s)) continue;
    const r = bySlug.get(s);
    if (r) {
      ordered.push(r);
      seen.add(s);
    }
  }
  if (ordered.length === 0 && all.length > 0) {
    return all.slice(0, 4);
  }
  return ordered;
}

function filterByCategory(all: Recipe[], key: SeasonOrAll): Recipe[] {
  if (key === "TODAS") return all;
  return all.filter((r) => r.category.toUpperCase() === key);
}

export type RecipeGridProps = {
  /**
   * `landing`: grid por defecto = recetas del hero (sin pestaña “populares”).
   * `full`: índice /recetas; por defecto “Todas”.
   */
  variant?: "landing" | "full";
  /** Precargado desde el servidor para no duplicar /api/recipes ni /api/hero */
  initialRecipes?: Recipe[];
  initialLandingSlugs?: string[];
};

export default function RecipeGrid({
  variant = "landing",
  initialRecipes,
  initialLandingSlugs,
}: RecipeGridProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(() =>
    initialRecipes && initialRecipes.length > 0 ? initialRecipes : []
  );
  const [landingSlugs, setLandingSlugs] = useState<string[]>(() =>
    Array.isArray(initialLandingSlugs) ? initialLandingSlugs : []
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    variant === "full" ? "TODAS" : "featured"
  );

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

  const scrollBySnap = useCallback((dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const stride = Math.min(el.clientWidth * 0.75, 360);
    el.scrollBy({ left: dir * stride, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (initialRecipes !== undefined && initialLandingSlugs !== undefined) {
      return;
    }

    let cancelled = false;

    Promise.all([
      fetch("/api/recipes").then((r) => r.json()),
      fetch("/api/hero").then((r) => r.json()),
    ])
      .then(([recipesData, heroData]) => {
        if (cancelled) return;
        if (Array.isArray(recipesData)) setRecipes(recipesData);
        const slugs = heroData?.landingRecipeSlugs;
        if (Array.isArray(slugs)) {
          setLandingSlugs(
            slugs.filter((x: unknown): x is string => typeof x === "string" && x.trim().length > 0)
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialRecipes, initialLandingSlugs]);

  const filteredRecipes = useMemo(() => {
    if (viewMode === "featured") {
      return pickLandingFeatured(recipes, landingSlugs);
    }
    return filterByCategory(recipes, viewMode);
  }, [recipes, landingSlugs, viewMode]);

  useEffect(() => {
    if (variant !== "landing") return;
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
  }, [variant, filteredRecipes.length, viewMode, syncScrollButtons]);

  const showFeaturedReset = variant === "landing" && viewMode !== "featured";

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-16">
      <div className="flex flex-col items-center gap-4">
        <div className="flex justify-start md:justify-center w-full min-w-0">
          <div
            className="
              flex flex-nowrap items-stretch md:items-center gap-2 md:gap-12
              overflow-x-auto no-scrollbar scroll-smooth
              max-md:pt-0.5 max-md:pb-1 max-md:pl-0 max-md:pr-8 max-md:-mx-1 max-md:px-1
              w-full max-md:snap-x max-md:snap-mandatory md:overflow-visible md:pb-4 md:-mb-4 md:px-0 md:w-auto
            "
          >
            {FILTER_ORDER.map((key) => {
              const active = viewMode === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setViewMode(key)}
                  className={`
                    group relative shrink-0 snap-start
                    max-md:rounded-full max-md:px-4 max-md:py-2.5 max-md:border max-md:text-[10px] max-md:font-sans max-md:font-bold
                    max-md:tracking-[0.18em] max-md:uppercase max-md:transition-all max-md:duration-300
                    ${active
                      ? "max-md:bg-brand-primary max-md:text-brand-secondary max-md:border-brand-primary"
                      : "max-md:bg-white/90 max-md:backdrop-blur-sm max-md:text-brand-muted max-md:border-brand-primary/15 max-md:hover:border-brand-accent/40 max-md:hover:text-brand-accent"
                    }
                    md:py-2 md:rounded-none md:border-0 md:bg-transparent md:backdrop-blur-none md:px-0
                  `}
                >
                  <span
                    className={`
                      max-md:text-inherit
                      text-[9px] md:text-sm font-sans font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase transition-colors duration-300
                      ${active ? "md:text-brand-accent" : "md:text-brand-muted md:group-hover:text-brand-primary"}
                    `}
                  >
                    {key}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="activeFilter"
                      className="hidden md:block absolute -bottom-1 left-0 right-0 h-px bg-brand-accent"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {showFeaturedReset && (
          <button
            type="button"
            onClick={() => setViewMode("featured")}
            className="text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-muted hover:text-brand-accent transition-colors"
          >
            ← Ver las destacadas del inicio
          </button>
        )}
      </div>

      {variant === "landing" && filteredRecipes.length > 0 && (
        <div className="md:hidden relative">
          <div
            ref={scrollRef}
            role="region"
            aria-roledescription="carrusel"
            aria-label="Recetas de temporada"
            className="no-scrollbar flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1"
          >
            {filteredRecipes.map((recipe, index) => (
              <div
                key={recipe.slug}
                className="flex-shrink-0 snap-start w-[min(78vw,280px)] sm:w-[min(42vw,280px)]"
              >
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.45 }}
                >
                  <RecipeCard
                    slug={recipe.slug}
                    title={recipe.title}
                    category={recipe.category}
                    image={recipe.image}
                  />
                </motion.div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-10">
            <button
              type="button"
              aria-label="Recetas anteriores"
              onClick={() => scrollBySnap(-1)}
              disabled={!canPrev}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-primary/15 text-brand-accent transition-opacity disabled:opacity-25"
            >
              <ChevronLeft size={24} strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Siguientes recetas"
              onClick={() => scrollBySnap(1)}
              disabled={!canNext}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-primary/15 text-brand-accent transition-opacity disabled:opacity-25"
            >
              <ChevronRight size={24} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      )}

      <motion.div
        layout
        className={
          variant === "landing"
            ? "hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16"
        }
      >
        <AnimatePresence mode="popLayout">
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.slug}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <RecipeCard
                slug={recipe.slug}
                title={recipe.title}
                category={recipe.category}
                image={recipe.image}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredRecipes.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-brand-muted font-sans italic">
            Próximamente más sabores de esta temporada...
          </p>
        </div>
      )}
    </div>
  );
}
