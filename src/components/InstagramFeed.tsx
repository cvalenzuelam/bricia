"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Config {
  instagramImages: { src: string; caption?: string; isVideo?: boolean }[];
}

export default function InstagramFeed() {
  const [images, setImages] = useState<{ src: string; caption?: string; isVideo?: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data: Config) => {
        if (data.instagramImages) {
          setImages(data.instagramImages);
        }
      })
      .catch(() => {});
  }, []);

  if (images.length === 0) return null;
  return (
    <section className="bg-brand-secondary pb-0 border-t border-brand-primary/5">
      <div className="pt-20 max-w-7xl mx-auto px-6 mb-16 text-center md:text-left">
        <h2 className="text-4xl md:text-5xl font-serif text-brand-primary mb-4 tracking-tight">
          Cocina, inspiración y comunidad
        </h2>
        <p className="text-brand-muted/80 font-sans text-sm md:text-base max-w-2xl mx-auto md:mx-0 leading-relaxed">
          Encuéntrame en mis redes: recetas, ideas para la mesa y el día a día. Comparte tus creaciones y
          acompáñanos en la comunidad.
        </p>
      </div>

      {/* Grid of 5 columns, perfectly hugging each other */}
      <div className="grid grid-cols-2 lg:grid-cols-5 w-full">
        {images.map((img, index) => (
          <a
            key={index}
            href="https://www.instagram.com/briciaelizalde/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square block overflow-hidden group bg-brand-primary/5"
          >
            <Image
              src={img.src}
              alt={img.caption || "Publicación de Bricia"}
              fill
              sizes="(max-width: 1024px) 50vw, 20vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Resting Play Button for Videos (like Wix) */}
            {img.isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                <div className="w-12 h-12 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-white/90 ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Elegant hover overlay with Wix-style caption */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-6 text-center">
               {img.caption && (
                 <p className="text-white font-sans text-xs leading-relaxed line-clamp-4">
                   {img.caption}
                 </p>
               )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
