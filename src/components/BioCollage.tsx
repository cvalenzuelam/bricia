"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const collageImages = [
  "/images/meat_real.png",
  "/images/tuna_real.png",
  "/images/spring.png",
  "/images/smores_real.png",
  "/images/autumn.png",
  "/images/dessert.png",
];

export default function BioCollage() {
  return (
    <section className="bg-brand-secondary py-32 px-6 overflow-hidden border-t border-brand-primary/5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
        
        {/* Left Side: Bio Text (Mandoka/Mockup Style) */}
        <div className="lg:w-1/2 text-center lg:text-left space-y-12">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-serif text-brand-primary/80 leading-tight lowercase">
              mis días de <br /> cocina en <br /> 
              <span className="text-5xl md:text-6xl font-bold tracking-[0.2em] font-sans text-brand-primary block mt-4">
                |BRICIA|
              </span>
            </h2>
          </div>

          <div className="space-y-8 max-w-lg mx-auto lg:mx-0">
            <p className="text-lg font-bold tracking-widest text-brand-accent uppercase">
              un blog que celebra la cocina emocional y los placeres cotidianos.
            </p>
            <div className="space-y-6 text-brand-primary/70 text-sm font-sans tracking-wide leading-relaxed uppercase font-medium">
              <p>
                aquí la cocina cotidiana cobró vida a través de recetas cálidas, deliciosas y pensadas para disfrutarse en casa.
              </p>
              <p>
                celebramos esos momentos simples alrededor de la mesa y dejamos que los aromas, los sabores y los ingredientes despierten la curiosidad del paladar.
              </p>
            </div>
          </div>

          <div className="pt-8 opacity-20 text-brand-primary">
            <span className="text-4xl">↓</span>
          </div>
        </div>

        {/* Right Side: Photo Collage (As per mockup) */}
        <div className="lg:w-1/2 grid grid-cols-2 md:grid-cols-3 gap-4 h-[600px] w-full">
          {collageImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className={`relative rounded-lg overflow-hidden group ${
                i === 0 ? "md:row-span-2" : ""
              } ${i === 3 ? "md:col-span-2" : ""}`}
            >
              <Image
                src={img}
                alt={`Cocina ${i}`}
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-brand-primary/10 group-hover:opacity-0 transition-opacity"></div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
