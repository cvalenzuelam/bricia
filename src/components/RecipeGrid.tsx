"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RecipeCard from "./RecipeCard";

interface Recipe {
  slug: string;
  title: string;
  category: string;
  image: string;
}

const CATEGORIES = ["TODAS", "PRIMAVERA", "VERANO", "OTOÑO", "INVIERNO", "POSTRES"];

export default function RecipeGrid() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeCategory, setActiveCategory] = useState("TODAS");

  useEffect(() => {
    fetch("/api/recipes", { cache: "no-store" })
      .then((res) => res.json())
      .then(setRecipes);
  }, []);

  const filteredRecipes = activeCategory === "TODAS" 
    ? recipes 
    : recipes.filter(r => r.category.toUpperCase() === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-16">
      {/* Dynamic Filter Bar - Improved for mobile display */}
      <div className="flex justify-start md:justify-center">
        <div className="flex flex-nowrap items-center gap-6 md:gap-12 overflow-x-auto no-scrollbar pb-4 -mb-4 px-4 w-full md:w-auto scroll-smooth">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`group relative py-2 shrink-0 ${cat === "TODAS" ? "hidden md:block" : ""}`}
            >
              <span className={`text-[9px] md:text-sm font-sans font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase transition-colors duration-300 ${
                activeCategory === cat ? "text-brand-accent" : "text-brand-muted hover:text-brand-primary"
              }`}>
                {cat}
              </span>
              {activeCategory === cat && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute -bottom-1 left-0 right-0 h-px bg-brand-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid with Grid Animation */}
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
            <p className="text-brand-muted font-sans italic">Próximamente más sabores de esta temporada...</p>
        </div>
      )}
    </div>
  );
}
