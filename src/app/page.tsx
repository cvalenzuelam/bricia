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
        href?: string;
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

      {/* 5–6. Cita + comunidad / Instagram (misma sección editorial) */}
      <InstagramFeed
        initialInstagramImages={instagramImages}
        fromServer
      >
        <div className="relative z-[1] px-6 pb-4 pt-16 text-center md:pb-6 md:pt-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 md:gap-10">
            <div className="flex gap-2" aria-hidden>
              <span className="h-12 w-px bg-gradient-to-b from-brand-accent/15 via-brand-accent/55 to-brand-accent/15" />
              <span className="h-12 w-px bg-gradient-to-b from-brand-accent/10 via-brand-accent/35 to-brand-accent/10" />
            </div>
            <h3 className="font-serif text-3xl italic leading-relaxed text-brand-primary md:text-4xl">
              Cocina con amor, mesas que conectan.
            </h3>
            <p className="max-w-xl font-sans text-sm leading-relaxed text-brand-muted md:text-[0.9375rem]">
              Cada receta en este blog tiene un origen, y cada mesa que montamos
              tiene una intención. No solo cocinamos para comer, diseñamos espacios
              para conectar los corazones.
            </p>
          </div>
        </div>
      </InstagramFeed>
    </main>
  );
}
