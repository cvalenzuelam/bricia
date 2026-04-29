import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Layers, Package, Ruler } from "lucide-react";
import { getProducts } from "@/data/products-server";
import { formatPrice } from "@/data/products";
import type { Product } from "@/data/products";
import ProductDetailAddToCart from "@/components/productos/ProductDetailAddToCart";
import ProductImageGallery from "@/components/productos/ProductImageGallery";
import { productAllImageUrls } from "@/lib/product-gallery";

const CATEGORY_TINT: Record<string, string> = {
  COCINA: "#A89F91",
  MESA: "#C2A878",
  DESPENSA: "#B5A18C",
  DECORACIÓN: "#9A9078",
};

function categoryColor(category: string): string {
  return CATEGORY_TINT[category.trim().toUpperCase()] ?? "#A89F91";
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ id: p.id }));
}

export const revalidate = 60;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.id === id);
  if (!product) {
    return { title: "Producto | Bricia" };
  }
  const title = `${product.name} | Alacena — Bricia`;
  const description =
    product.description?.trim() ||
    `${product.subtitle}. ${product.category} en la tienda de Bricia.`;
  const origin = siteOrigin();
  const allImages = productAllImageUrls(product);
  const ogImages = allImages.slice(0, 4).map((src) => ({
    url: src.startsWith("http")
      ? src
      : origin
        ? `${origin}${src.startsWith("/") ? src : `/${src}`}`
        : src,
    alt: product.name,
  }));
  const fallbackSrc = (product.image?.trim() || "/images/mesa_setting.png");
  const fallbackOg = {
    url: fallbackSrc.startsWith("http")
      ? fallbackSrc
      : origin
        ? `${origin}${fallbackSrc.startsWith("/") ? fallbackSrc : `/${fallbackSrc}`}`
        : fallbackSrc,
    alt: product.name,
  };

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 200),
      images: ogImages.length > 0 ? ogImages : [fallbackOg],
    },
  };
}

function siteOrigin(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (base) return base;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "";
}

function toAbsoluteImageUrl(src: string, origin: string): string {
  if (src.startsWith("http")) return src;
  return origin ? `${origin}${src.startsWith("/") ? src : `/${src}`}` : src;
}

function productJsonLd(product: Product, origin: string) {
  const path = `/productos/${product.id}`;
  const pageUrl = origin ? `${origin}${path}` : path;
  const imageUrls = productAllImageUrls(product).map((u) => toAbsoluteImageUrl(u, origin));
  const schemaImage =
    imageUrls.length === 0
      ? toAbsoluteImageUrl(product.image?.trim() || "/images/mesa_setting.png", origin)
      : imageUrls.length === 1
        ? imageUrls[0]
        : imageUrls;

  const additional: { "@type": "PropertyValue"; name: string; value: string }[] = [];
  const dim = product.dimensions?.trim();
  const mat = product.material?.trim();
  if (dim) additional.push({ "@type": "PropertyValue", name: "Dimensiones", value: dim });
  if (mat) additional.push({ "@type": "PropertyValue", name: "Material", value: mat });

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: schemaImage,
    sku: product.id,
    ...(additional.length > 0 ? { additionalProperty: additional } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      ...(origin ? { url: pageUrl } : {}),
    },
    brand: { "@type": "Brand", name: "Bricia" },
  };
}

export default async function ProductoDetallePage({ params }: PageProps) {
  const { id } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  const origin = siteOrigin();

  const sameCategory = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);
  const related =
    sameCategory.length > 0
      ? sameCategory
      : products.filter((p) => p.id !== product.id).slice(0, 3);
  const relatedHeadingSameCategory = sameCategory.length > 0;

  const tint = categoryColor(product.category);
  const dim = product.dimensions?.trim();
  const mat = product.material?.trim();

  return (
    <article className="min-h-screen bg-brand-secondary pt-28 pb-24 md:pt-32 md:pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product, origin)),
        }}
      />

      <nav className="max-w-7xl mx-auto px-6 py-8 md:py-12 flex justify-between items-center border-b border-brand-primary/5 mb-10 md:mb-16">
        <Link
          href="/productos"
          className="editorial-spacing flex items-center gap-2 hover:text-brand-accent transition-colors text-brand-primary/80"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Volver a la alacena
        </Link>
        <span
          className="editorial-spacing text-[10px] font-sans font-bold tracking-[0.28em]"
          style={{ color: tint }}
        >
          {product.category}
        </span>
        <div className="w-20 hidden sm:block" aria-hidden />
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Imagen */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-32 space-y-6">
              <ProductImageGallery
                images={productAllImageUrls(product)}
                productName={product.name}
              />
              <p className="text-xs font-sans text-brand-muted/80 text-center lg:text-left leading-relaxed max-w-xl">
                Fotografía referencial. Piezas artesanales: vetas, tonos y detalles pueden variar ligeramente.
              </p>
            </div>
          </div>

          {/* Contenido */}
          <div className="lg:col-span-5 space-y-8">
            <header className="space-y-6 text-center lg:text-left">
              <p className="editorial-spacing text-brand-accent">La alacena</p>
              <h1 className="text-5xl md:text-6xl lg:text-[3.5rem] font-serif text-brand-primary tracking-tight leading-[1.05]">
                {product.name}
              </h1>
              <p className="text-lg md:text-xl font-serif italic text-brand-primary/70">
                {product.subtitle}
              </p>
              <div className="w-16 h-px bg-brand-accent/40 mx-auto lg:mx-0 origin-center" />
            </header>

            <div className="max-w-none">
              <p className="text-base md:text-lg font-serif text-brand-primary/80 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {(dim || mat) && (
              <div className="rounded-2xl border border-brand-primary/10 bg-white/35 px-6 py-5 space-y-4">
                <p className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-brand-muted">
                  Detalles
                </p>
                <dl className="space-y-4">
                  {dim && (
                    <div className="flex gap-3 md:gap-4">
                      <dt className="shrink-0 flex items-start gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.12em] text-brand-primary/55">
                        <Ruler size={14} strokeWidth={1.5} className="mt-0.5 text-brand-accent/80 shrink-0" aria-hidden />
                        Dimensiones
                      </dt>
                      <dd className="text-sm md:text-[15px] font-sans text-brand-primary/85 leading-snug">{dim}</dd>
                    </div>
                  )}
                  {mat && (
                    <div className="flex gap-3 md:gap-4">
                      <dt className="shrink-0 flex items-start gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.12em] text-brand-primary/55">
                        <Layers size={14} strokeWidth={1.5} className="mt-0.5 text-brand-accent/80 shrink-0" aria-hidden />
                        Material
                      </dt>
                      <dd className="text-sm md:text-[15px] font-sans text-brand-primary/85 leading-snug">{mat}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <div className="rounded-2xl border border-brand-primary/8 bg-white/60 p-8 space-y-6 backdrop-blur-sm">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-brand-muted mb-2">
                    Precio
                  </p>
                  <p className="font-serif text-3xl md:text-4xl text-brand-primary">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {product.stock > 0 && product.stock <= 3 && (
                    <span className="text-[9px] font-sans text-brand-accent border border-brand-accent/35 rounded-full px-3 py-1.5 tracking-[0.15em] uppercase">
                      Últimas {product.stock}
                    </span>
                  )}
                  {product.stock > 3 && (
                    <span className="text-[10px] font-sans text-brand-muted tracking-[0.12em] flex items-center gap-1.5">
                      <Package size={14} strokeWidth={1.5} className="opacity-50" />
                      {product.stock} en existencia
                    </span>
                  )}
                </div>
              </div>

              <ProductDetailAddToCart product={product} />

              <p className="text-[11px] font-sans text-brand-muted text-center leading-relaxed">
                Envío y disponibilidad se confirman al finalizar la compra. Piezas en cantidades limitadas.
              </p>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24 md:mt-32 pt-16 border-t border-brand-primary/5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
              <h2 className="text-3xl md:text-4xl font-serif text-brand-primary lowercase">
                {relatedHeadingSameCategory ? (
                  <>
                    Más en <span className="italic text-brand-accent">{product.category.toLowerCase()}</span>
                  </>
                ) : (
                  <>
                    Más de la <span className="italic text-brand-accent">alacena</span>
                  </>
                )}
              </h2>
              <Link
                href="/productos"
                className="editorial-spacing text-brand-muted hover:text-brand-accent transition-colors shrink-0"
              >
                Ver toda la alacena →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/productos/${p.id}`}
                  className="group flex flex-col gap-4"
                >
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-brand-primary/5 shadow-sm">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-brand-primary group-hover:text-brand-accent transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-sm font-serif text-brand-primary/60">{formatPrice(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
