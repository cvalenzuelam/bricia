"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16"
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
