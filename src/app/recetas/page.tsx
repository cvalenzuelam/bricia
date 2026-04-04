import { getRecipes } from "@/data/recipes";
import RecipeCard from "@/components/RecipeCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default function RecetasPage() {
  const recipes = getRecipes();

  return (
    <article className="min-h-screen bg-brand-secondary pt-32 pb-20">
      {/* Editorial Header */}
      <div className="max-w-7xl mx-auto px-6 mb-24 flex flex-col items-center text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-serif text-brand-primary tracking-tight">
          Índice de <span className="italic text-brand-accent">Recetas</span>
        </h1>
        <div className="w-24 h-px bg-brand-accent opacity-30"></div>
        <p className="text-sm font-sans text-brand-muted max-w-lg leading-relaxed">
          Sabores que cuentan historias, inspirados por el clima y el tiempo.
        </p>
      </div>

      {/* Full Grid */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-32">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.slug} {...recipe} />
        ))}
      </div>

      {/* Back link */}
      <div className="text-center">
        <Link href="/" className="editorial-spacing hover:text-brand-accent transition-colors flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> VOLVER AL INICIO
        </Link>
      </div>
    </article>
  );
}
