import RecipeGrid from "@/components/RecipeGrid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRecipes } from "@/data/recipes";
import { Reveal } from "@/components/motion/Reveal";

export const dynamic = "force-dynamic";

export default async function RecetasPage() {
  const recipes = await getRecipes();

  return (
    <article className="min-h-screen bg-brand-secondary pt-32 pb-20">
      <Reveal className="max-w-7xl mx-auto px-6 mb-24 flex flex-col items-center text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-serif text-brand-primary tracking-tight">
          Índice de <span className="italic text-brand-accent">Recetas</span>
        </h1>
        <div className="w-24 h-px bg-brand-accent opacity-30" />
        <p className="text-sm font-sans text-brand-muted max-w-lg leading-relaxed">
          Sabores que cuentan historias, inspirados por el clima y el tiempo.
        </p>
      </Reveal>

      <RecipeGrid variant="full" initialRecipes={recipes} />

      <Reveal className="text-center mt-20 md:mt-32" delay={0.1}>
        <Link
          href="/"
          className="editorial-spacing nav-link-underline hover:text-brand-accent inline-flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} /> VOLVER AL INICIO
        </Link>
      </Reveal>
    </article>
  );
}
