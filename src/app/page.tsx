import Hero from "@/components/Hero";
import FeaturedRecipe from "@/components/FeaturedRecipe";
import RecipeGrid from "@/components/RecipeGrid";
import ProductSection from "@/components/ProductSection";
import MesaSection from "@/components/MesaSection";
import InstagramFeed from "@/components/InstagramFeed";
import { getMesaArticles } from "@/data/lamesa";

export default async function Home() {
  const mesaArticles = await getMesaArticles();

  return (
    <main className="min-h-screen pt-28 md:pt-20 overflow-x-hidden bg-brand-secondary">
      {/* 1. Hero: Wix-style split with bio + photo mosaic */}
      <Hero />
      
      {/* 2. Featured CTA: "Nuevas Recetas Cada Semana" */}
      <FeaturedRecipe />

      {/* 3. Recipe Grid */}
      <section className="py-12 md:py-28">
        <div className="max-w-7xl mx-auto px-6 text-center mb-10 md:mb-20">
          <span className="editorial-spacing text-brand-accent block mb-4">EXPLORA</span>
          <h2 className="text-4xl md:text-6xl font-serif text-brand-primary tracking-tight">
            Recetas de <span className="italic text-brand-accent">Temporada</span>
          </h2>
          <div className="w-12 h-px bg-brand-accent mx-auto my-6 opacity-30"></div>
          <p className="text-sm font-sans text-brand-muted max-w-lg mx-auto">
            Descubre los sabores que acompañan el clima de hoy. 
            Recetas frescas, caseras y llenas de historia.
          </p>
        </div>
        <RecipeGrid />
      </section>

      {/* 4. Mesa Section */}
      <MesaSection articles={mesaArticles} />

      {/* 5. Products */}
      <ProductSection />

      {/* 6. Final Quote */}
      <section className="py-16 md:py-32 px-6 bg-brand-secondary text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-6xl text-brand-accent/20 font-serif">"</div>
          <h3 className="text-3xl md:text-4xl font-serif italic text-brand-primary leading-relaxed">
            Cocina con amor, mesas que conectan.
          </h3>
          <p className="text-sm font-sans text-brand-muted max-w-xl mx-auto leading-relaxed">
            Cada receta en este blog tiene un origen, y cada mesa que montamos 
            tiene una intención. No solo cocinamos para comer, diseñamos espacios 
            para conectar los corazones.
          </p>
          <div className="w-16 h-px bg-brand-accent mx-auto opacity-30"></div>
        </div>
      </section>

      {/* 7. Instagram Feed */}
      <InstagramFeed />
    </main>
  );
}
