"use client";

import Image from "next/image";
import Link from "next/link";
import { shouldUnoptimizeRemoteImage } from "@/lib/next-image-remote";
import { motion } from "framer-motion";

interface RecipeCardProps {
  slug: string;
  title: string;
  category: string;
  image: string;
  className?: string;
}

export default function RecipeCard({
  slug,
  title,
  category,
  image,
  className = "",
}: RecipeCardProps) {
  return (
    <Link href={`/recetas/${slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`group cursor-pointer flex flex-col gap-4 ${className}`}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-brand-secondary">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized={shouldUnoptimizeRemoteImage(image)}
            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <span className="text-[10px] font-sans font-semibold tracking-[0.25em] text-brand-accent uppercase block">
            {category}
          </span>
          <h3 className="text-lg font-serif text-brand-primary group-hover:text-brand-accent transition-colors duration-300">
            {title}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
}
