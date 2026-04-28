"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check } from "lucide-react";
import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

type Props = {
  product: Product;
};

export default function ProductDetailAddToCart({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const disabled = product.stock <= 0;

  const handleAdd = () => {
    if (disabled) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  if (disabled) {
    return (
      <p className="text-sm font-sans text-brand-muted italic border border-brand-primary/10 rounded-xl py-4 px-6 text-center bg-white/50">
        Por ahora no hay unidades disponibles. Vuelve pronto o explora el resto de la alacena.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`w-full py-4 rounded-xl text-[10px] font-sans font-bold tracking-[0.2em] uppercase transition-all duration-500 flex items-center justify-center gap-2 ${
        added
          ? "bg-green-600 text-white"
          : "bg-brand-primary text-brand-secondary hover:bg-brand-accent"
      }`}
    >
      <AnimatePresence mode="wait">
        {added ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Check size={14} /> Agregado al carrito
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <ShoppingBag size={15} strokeWidth={1.5} /> Agregar a la bolsa
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
