"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Product {
  name: string;
  price: string;
  image: string;
  link?: string;
}

type CatalogItem = { id: string; name: string };

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Enlaza al detalle /productos/[id] emparejando por nombre con la alacena real. */
function resolveProductHref(heroProduct: Product, catalog: CatalogItem[]): string {
  const target = normalizeForMatch(heroProduct.name);
  const match = catalog.find((c) => normalizeForMatch(c.name) === target);
  if (match) return `/productos/${match.id}`;
  const manual = heroProduct.link?.trim();
  if (manual?.startsWith("http")) return manual;
  if (manual?.startsWith("/productos/")) return manual;
  return "/productos";
}

export default function ProductSection() {
  const [products, setProducts] = useState<(Product & { href: string })[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/hero").then((res) => res.json()),
      fetch("/api/productos", { cache: "no-store" }).then((res) => res.json()),
    ])
      .then(([heroData, catalogData]) => {
        if (cancelled || !heroData?.products || !Array.isArray(heroData.products)) return;
        const catalog: CatalogItem[] = Array.isArray(catalogData)
          ? catalogData
              .filter(
                (x: unknown): x is CatalogItem =>
                  Boolean(x) &&
                  typeof x === "object" &&
                  typeof (x as CatalogItem).id === "string" &&
                  typeof (x as CatalogItem).name === "string"
              )
          : [];
        const withHref = (heroData.products as Product[]).map((p) => ({
          ...p,
          href: resolveProductHref(p, catalog),
        }));
        setProducts(withHref);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="bg-brand-primary text-brand-secondary py-32 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <span className="editorial-spacing text-[#C2A878]">LA TIENDA</span>
          <h2 className="text-4xl md:text-6xl font-serif text-brand-secondary tracking-tight">
            Objetos con Alma
            <br />
            <span className="italic text-[#C2A878]">para Tu Mesa</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {products.map((product, i) => {
            const href = product.href;
            const external = href.startsWith("http");
            const content = (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group cursor-pointer space-y-5"
              >
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                  />
                </div>
                <div className="text-center space-y-1.5">
                  <h4 className="text-lg font-serif text-brand-secondary group-hover:text-[#C2A878] transition-colors duration-300">
                    {product.name}
                  </h4>
                  <p className="text-xs font-sans text-white/45 tracking-widest">{product.price}</p>
                </div>
              </motion.div>
            );
            if (external) {
              return (
                <a key={`${product.name}-${i}`} href={href} className="block" rel="noopener noreferrer" target="_blank">
                  {content}
                </a>
              );
            }
            return (
              <Link key={`${product.name}-${i}`} href={href} className="block">
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
