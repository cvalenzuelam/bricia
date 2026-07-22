import { getRecipes, getRecipeBySlug } from "@/data/recipes";
import { resolveRecipeClosingPhrase } from "@/data/recipe-closing";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Users } from "lucide-react";
import RecipeGallery from "@/components/RecipeGallery";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const recipes = await getRecipes();
  return recipes.map((r) => ({ slug: r.slug }));
}

export const dynamic = "force-dynamic";

export default async function RecipePage({ params }: PageProps) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-brand-secondary pt-32 pb-32">
      <nav className="max-w-7xl mx-auto px-6 py-12 flex justify-between items-center border-b border-brand-primary/5 mb-16">
        <Link href="/recetas" className="editorial-spacing nav-link-underline flex items-center gap-2 hover:text-brand-accent">
          <ArrowLeft size={16} /> VOLVER
        </Link>
        <span className="editorial-spacing opacity-40">{recipe.category}</span>
        <div className="w-20"></div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 text-center space-y-8 mb-24">
        <h1 className="text-5xl md:text-7xl font-serif text-brand-primary tracking-tight leading-none">
          {recipe.title} <br />
          <span className="italic text-brand-accent">{recipe.subtitle}</span>
        </h1>
        <div className="flex justify-center gap-12 text-xs font-sans tracking-[0.3em] text-brand-muted uppercase">
          <div className="flex items-center gap-2"><Clock size={14} /> {recipe.prepTime}</div>
          <div className="flex items-center gap-2"><Users size={14} /> {recipe.servings}</div>
        </div>
      </div>

      <RecipeGallery
        title={recipe.title}
        heroImage={recipe.image}
        gallery={recipe.gallery}
      >
        {recipe.videoUrl?.trim() && (
          <div className="max-w-4xl mx-auto px-6 mb-24 flex justify-center">
            <a
              href={recipe.videoUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-xl md:text-2xl italic text-[#5a6b52] underline underline-offset-[5px] decoration-[#5a6b52]/80 decoration-1 hover:text-brand-accent hover:decoration-brand-accent transition-colors duration-300"
            >
              Clic aquí para ver el video.
            </a>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-6 space-y-32">
          <section className="space-y-12">
            <h2 className="editorial-spacing border-b border-brand-accent/30 pb-4 inline-block">LA HISTORIA</h2>
            <p className="text-2xl md:text-3xl font-serif leading-relaxed text-brand-primary/90 italic">
              &ldquo;{recipe.history}&rdquo;
            </p>
          </section>
        </div>
      </RecipeGallery>

      <div className="max-w-6xl mx-auto px-6 space-y-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24">
          <section className="space-y-12">
            <h2 className="editorial-spacing border-b border-brand-accent/30 pb-4 inline-block text-brand-primary">INGREDIENTES</h2>
            <div className="bg-white/60 backdrop-blur-md border border-brand-primary/5 rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="group flex items-center gap-4 p-4 hover:bg-white hover:shadow-sm rounded-2xl transition-all duration-300 border border-transparent hover:border-brand-primary/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent/40 group-hover:bg-brand-accent group-hover:scale-[2] transition-all duration-300 shadow-sm" />
                    <span className="text-lg font-serif text-brand-primary/80 group-hover:text-brand-primary transition-colors">{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-12">
            <h2 className="editorial-spacing border-b border-brand-accent/30 pb-4 inline-block text-brand-primary">PREPARACIÓN</h2>
            <div className="space-y-8 relative">
              <div className="absolute top-6 bottom-6 left-[23px] w-px bg-gradient-to-b from-brand-accent/40 via-brand-accent/10 to-transparent" />

              {recipe.steps.map((step, i) => (
                <div key={i} className="relative flex items-start gap-6 group">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-brand-secondary border-[3px] border-white shadow-sm flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:shadow-md transition-all duration-500">
                    <span className="text-sm font-bold text-brand-accent font-sans">{i + 1}</span>
                  </div>
                  <div className="flex-1 bg-white/60 hover:bg-white backdrop-blur-md border border-brand-primary/5 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                    <span className="absolute -bottom-6 -right-2 text-9xl font-serif text-brand-primary/[0.02] select-none group-hover:scale-110 group-hover:text-brand-primary/[0.04] transition-all duration-700 pointer-events-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-brand-accent uppercase mb-3 block">Paso {String(i + 1).padStart(2, "0")}</span>
                    <p className="text-lg font-serif leading-relaxed text-brand-primary/80 relative z-10">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-40 text-center">
        <div className="w-24 h-px bg-brand-accent mx-auto mb-12 opacity-30"></div>
        <p className="text-3xl font-serif italic text-brand-accent">
          {resolveRecipeClosingPhrase(recipe)}
        </p>
      </div>
    </article>
  );
}
