"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FeaturedRecipe() {
  return (
    <section className="bg-[#8B7355] py-0 overflow-hidden">
      <div className="max-w-[1600px] mx-auto flex flex-col-reverse md:flex-row items-stretch min-h-[70vh]">
        
        {/* Left: Full-bleed image */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="md:w-1/2 relative min-h-[50vh] md:min-h-full"
        >
          <Image
            src="/images/tiradito.png"
            alt="Nuevas Recetas Cada Semana"
            fill
            sizes="50vw"
            className="object-cover"
          />
        </motion.div>

        {/* Right: Content on warm bg */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="md:w-1/2 flex flex-col justify-center px-12 md:px-20 py-20 text-white"
        >
          <div className="max-w-lg space-y-8">
            <h2 className="text-4xl md:text-5xl font-serif leading-tight">
              Nuevas Recetas
              <br />
              Cada Semana
            </h2>
            
            <div className="w-12 h-px bg-white/30"></div>
            
            <p className="text-base font-sans text-white/80 leading-relaxed">
              Descubre recetas que tocan el corazón y despiertan tus sentidos. 
              Cada semana traemos algo nuevo para que disfrutes en tu cocina. 
              ¡Explora y déjate inspirar!
            </p>

            <div className="pt-4">
              <Link href="/recetas">
                <button className="bg-white text-[#8B7355] px-8 py-3.5 text-xs font-bold tracking-[0.2em] uppercase hover:bg-brand-accent hover:text-white transition-all duration-300">
                  Ver Recetas
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
