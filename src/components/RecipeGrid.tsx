"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import RecipeCard from "./RecipeCard";
import { duration, easeOutExpo } from "@/lib/motion";
import { getCurrentSeasonCategory } from "@/lib/season";

interface Recipe {
  slug: string;
  title: string;
  category: string;
  image: string;
}

const SEASON_CATEGORIES = ["PRIMAVERA", "VERANO", "OTOÑO", "INVIERNO", "POSTRES"] as const;
/** Misma lógica visual que la tienda: TODAS primero, luego el resto. */
const FILTER_ORDER = ["TODAS", ...SEASON_CATEGORIES] as const;
type SeasonOrAll = (typeof FILTER_ORDER)[number];

/** En inicio + TODAS: muestra hasta 16; el resto en /recetas. */
const LANDING_TODAS_LIMIT = 16;

function filterByCategory(all: Recipe[], key: SeasonOrAll): Recipe[] {
  if (key === "TODAS") return all;
  return all.filter((r) => r.category.toUpperCase() === key);
}

export type RecipeGridProps = {
  /**
   * `landing`: en TODAS muestra hasta 16 + enlace a /recetas.
   * `full`: índice completo.
   */
  variant?: "landing" | "full";
  /** Precargado desde el servidor para no duplicar /api/recipes */
  initialRecipes?: Recipe[];
};

export default function RecipeGrid({
  variant = "full",
  initialRecipes,
}: RecipeGridProps) {
  const seasonDefault = useMemo(() => getCurrentSeasonCategory(), []);
  const [recipes, setRecipes] = useState<Recipe[]>(() =>
    initialRecipes && initialRecipes.length > 0 ? initialRecipes : []
  );
  const [viewMode, setViewMode] = useState<SeasonOrAll>(seasonDefault);
  const [userPicked, setUserPicked] = useState(false);

  useEffect(() => {
    if (initialRecipes !== undefined) return;

    let cancelled = false;
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((recipesData) => {
        if (cancelled) return;
        if (Array.isArray(recipesData)) setRecipes(recipesData);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialRecipes]);

  /** Si la estación actual no tiene recetas, cae a TODAS (salvo que el usuario ya eligió). */
  useEffect(() => {
    if (userPicked || recipes.length === 0) return;
    const count = filterByCategory(recipes, seasonDefault).length;
    if (count === 0) setViewMode("TODAS");
  }, [recipes, seasonDefault, userPicked]);

  const isLanding = variant === "landing";

  const filteredRecipes = useMemo(() => {
    const list = filterByCategory(recipes, viewMode);
    if (isLanding && viewMode === "TODAS") {
      return list.slice(0, LANDING_TODAS_LIMIT);
    }
    return list;
  }, [recipes, viewMode, isLanding]);

  const showMoreLink =
    isLanding &&
    viewMode === "TODAS" &&
    recipes.length > LANDING_TODAS_LIMIT;

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-16">
      <div className="flex justify-center">
        <div className="flex gap-2 flex-wrap justify-center">
          {FILTER_ORDER.map((key) => {
            const active = viewMode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setUserPicked(true);
                  setViewMode(key);
                }}
                className={`chip-btn px-5 py-2 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] uppercase ${
                  active
                    ? "bg-brand-primary text-brand-secondary shadow-[0_8px_20px_-10px_rgba(29,29,27,0.45)]"
                    : "border border-brand-primary/10 text-brand-muted hover:border-brand-accent/50 hover:text-brand-accent hover:bg-brand-accent/[0.08]"
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        layout
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:gap-x-8 md:gap-y-16"
      >
        <AnimatePresence mode="popLayout">
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.slug}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: duration.base, delay: Math.min(index * 0.04, 0.4), ease: easeOutExpo }}
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

      {showMoreLink && (
        <div className="flex justify-center -mt-4 md:-mt-8">
          <Link
            href="/recetas"
            className="group inline-flex items-center gap-3 text-[11px] font-sans font-bold tracking-[0.22em] uppercase text-brand-primary hover:text-brand-accent px-4 py-2 rounded-full hover:bg-brand-accent/[0.08]"
          >
            Ver más recetas
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      )}

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
