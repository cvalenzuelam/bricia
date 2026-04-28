import Hero from "@/components/Hero";
import FeaturedRecipe from "@/components/FeaturedRecipe";
import RecipeGrid from "@/components/RecipeGrid";
import ProductSection from "@/components/ProductSection";
import InstagramFeed from "@/components/InstagramFeed";
import { loadHeroPayload } from "@/data/hero-config-loader";
import { getProducts } from "@/data/products-server";
import { getRecipes } from "@/data/recipes";

export default async function Home() {
  const [products, recipes, heroRaw] = await Promise.all([
    getProducts(),
    getRecipes(),
    loadHeroPayload(),
  ]);

  const hero =
    heroRaw && typeof heroRaw === "object"
      ? (heroRaw as Record<string, unknown>)
      : {};

  const landingSlugList = hero["landingRecipeSlugs"];
  const landingSlugs = Array.isArray(landingSlugList)
    ? landingSlugList.filter(
        (x): x is string =>
          typeof x === "string" && x.trim().length > 0
      )
    : [];

  const instagramRaw = hero["instagramImages"];
  const instagramImages = Array.isArray(instagramRaw)
    ? (instagramRaw as {
        src: string;
        caption?: string;
        isVideo?: boolean;
      }[])
    : undefined;

  return (
    <main className="min-h-screen overflow-x-hidden bg-brand-secondary">
      {/* 1. Hero — datos ya resueltos en servidor → sin 5× /api/hero */}
      <Hero initialHero={heroRaw} />

      {/* 2. Featured CTA */}
      <FeaturedRecipe
        initialFeatured={hero.featuredSection}
        fromServer
      />

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
        <RecipeGrid
          variant="landing"
          initialRecipes={recipes}
          initialLandingSlugs={landingSlugs}
        />
      </section>

      {/* 4. Tienda — carrusel */}
      <ProductSection initialProducts={products} />

      {/* 5. Final Quote */}
      <section className="py-16 md:py-32 px-6 bg-brand-secondary text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-6xl text-brand-accent/20 font-serif">{`"`}</div>
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

      {/* 6. Instagram */}
      <InstagramFeed
        initialInstagramImages={instagramImages}
        fromServer
      />
    </main>
  );
}
