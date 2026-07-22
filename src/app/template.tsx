"use client";

import { motion, useReducedMotion } from "framer-motion";
import { pageEnter } from "@/lib/motion";

/** Transición suave al cambiar de ruta. Respeta prefer-reduced-motion. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={pageEnter.initial}
      animate={pageEnter.animate}
      transition={pageEnter.transition}
    >
      {children}
    </motion.div>
  );
}
