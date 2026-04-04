"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import RecipeCard from "./RecipeCard";

interface Recipe {
  slug: string;
  title: string;
  category: string;
  image: string;
}

export default function RecipeGrid() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then(setRecipes);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {recipes.map((recipe, index) => (
          <motion.div
            key={recipe.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <RecipeCard
              slug={recipe.slug}
              title={recipe.title}
              category={recipe.category}
              image={recipe.image}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
