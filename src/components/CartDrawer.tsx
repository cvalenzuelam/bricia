"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";

export default function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, itemCount } = useCart();

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  const goToStore = () => {
    closeCart();
    router.push("/productos");
  };

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 bottom-0 z-[90] w-full max-w-md bg-brand-secondary flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-brand-primary/5">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-brand-accent" strokeWidth={1.5} />
                <span className="font-serif text-xl text-brand-primary">
                  Tu selección
                </span>
                {itemCount > 0 && (
                  <span className="text-[10px] font-sans font-bold tracking-[0.15em] text-brand-accent border border-brand-accent/30 rounded-full px-2.5 py-0.5">
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="text-brand-muted hover:text-brand-primary transition-colors"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-6 py-20">
                  <ShoppingBag size={40} className="text-brand-primary/10" strokeWidth={1} />
                  <div className="space-y-2">
                    <p className="font-serif text-2xl italic text-brand-primary/40">
                      Tu selección está vacía.
                    </p>
                    <p className="text-xs font-sans text-brand-muted">
                      Agrega algo desde la tienda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={goToStore}
                    className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-brand-accent hover:text-brand-primary transition-colors flex items-center gap-2"
                  >
                    Explorar tienda <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map(({ product, quantity }) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-start gap-4 pb-6 border-b border-brand-primary/5 last:border-0"
                    >
                      {/* Image */}
                      <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-white shrink-0 border border-brand-primary/5">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <p className="text-[9px] font-sans font-bold tracking-[0.25em] text-brand-accent uppercase">
                            {product.category}
                          </p>
                          <h4 className="font-serif text-lg text-brand-primary leading-tight">
                            {product.name}
                          </h4>
                          <p className="text-xs font-sans text-brand-muted">{product.subtitle}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantity control */}
                          <div className="flex items-center gap-2 border border-brand-primary/10 rounded-full px-3 py-1.5">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="text-brand-muted hover:text-brand-primary transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-sans font-bold text-brand-primary w-4 text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= product.stock}
                              className="text-brand-muted hover:text-brand-primary transition-colors disabled:opacity-30"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-serif text-base text-brand-primary">
                              {formatPrice(product.price * quantity)}
                            </span>
                            <button
                              onClick={() => removeItem(product.id)}
                              className="text-brand-muted hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer / Checkout */}
            {items.length > 0 && (
              <div className="px-8 py-6 border-t border-brand-primary/5 space-y-4 bg-white">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans text-brand-muted tracking-widest uppercase">Subtotal</span>
                  <span className="font-serif text-2xl text-brand-primary">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <p className="text-[10px] font-sans text-brand-muted/70 text-center">
                  Gastos de envío calculados al finalizar la compra.
                </p>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full bg-brand-primary text-brand-secondary py-4 rounded-xl text-xs font-sans font-bold tracking-[0.2em] uppercase hover:bg-brand-accent transition-colors flex items-center justify-center gap-2"
                >
                  Siguiente: datos y envío
                  <ArrowRight size={13} />
                </button>

                <button
                  onClick={closeCart}
                  className="w-full text-center text-[10px] font-sans text-brand-muted hover:text-brand-accent transition-colors tracking-[0.2em] uppercase"
                >
                  Seguir explorando
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
