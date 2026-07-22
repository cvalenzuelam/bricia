"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import {
  duration,
  easeOutExpo,
  fadeUp,
  fadeIn,
  ruleGrow,
  scaleIn,
  staggerContainer,
  staggerFast,
  viewportOnce,
} from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "up" | "fade" | "scale";
};

const variantsMap = {
  up: fadeUp,
  fade: fadeIn,
  scale: scaleIn,
};

export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variantsMap[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ duration: duration.base, ease: easeOutExpo, delay }}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  fast?: boolean;
};

export function Stagger({ children, className, fast = false }: StaggerProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={fast ? staggerFast : staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
};

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      transition={{ duration: duration.base, ease: easeOutExpo }}
    >
      {children}
    </motion.div>
  );
}

/** Cabecera editorial de sección: eyebrow → título → regla → subtítulo */
export function SectionIntro({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  className = "",
  dark = false,
  titleClassName,
}: {
  eyebrow: string;
  title: ReactNode;
  titleAccent?: string;
  subtitle?: string;
  className?: string;
  dark?: boolean;
  /** Override tipografía del h2 (p. ej. sin lg:text-8xl) */
  titleClassName?: string;
}) {
  const titleColor = dark ? "text-brand-secondary" : "text-brand-primary";
  const subColor = dark ? "text-brand-secondary/60" : "text-brand-primary/60";
  const h2Class =
    titleClassName ??
    `text-5xl md:text-7xl lg:text-8xl font-serif ${titleColor} lowercase tracking-tighter`;

  return (
    <Stagger className={`text-center space-y-6 md:space-y-8 ${className}`}>
      <StaggerItem>
        <span className="editorial-spacing text-brand-accent block">{eyebrow}</span>
      </StaggerItem>
      <StaggerItem>
        <h2 className={h2Class}>
          {title}
          {titleAccent ? (
            <>
              {" "}
              <span className="italic text-brand-accent">{titleAccent}</span>
            </>
          ) : null}
        </h2>
      </StaggerItem>
      <StaggerItem>
        <motion.div
          variants={ruleGrow}
          className="w-16 h-px bg-brand-accent mx-auto opacity-40 origin-center"
          transition={{ duration: duration.slow, ease: easeOutExpo }}
          aria-hidden
        />
      </StaggerItem>
      {subtitle ? (
        <StaggerItem>
          <p
            className={`text-base md:text-lg font-serif italic ${subColor} max-w-xl mx-auto leading-relaxed`}
          >
            {subtitle}
          </p>
        </StaggerItem>
      ) : null}
    </Stagger>
  );
}
