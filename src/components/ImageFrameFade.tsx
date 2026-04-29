import type { CSSProperties } from "react";
import {
  editorialCardFadeOnDarkStyle,
  editorialCardFadeStyle,
} from "@/lib/image-frame-fade";

export type ImageFrameFadeVariant = "cream" | "white" | "dark";

const TINT: Record<"cream" | "white", string> = {
  cream: "#FAF9F4",
  white: "#FFFFFF",
};

/**
 * Viñeta editorial sobre fotos en marcos (mismo lenguaje que el hero, más suave).
 * Colocar dentro del contenedor `relative` junto a `next/image` (fill).
 * `tint` opcional: p. ej. fondo de página (#FDFCF8 en La Mesa).
 */
export default function ImageFrameFade({
  variant,
  tint,
  className = "",
  style,
}: {
  variant: ImageFrameFadeVariant;
  /** Si se define, sustituye el color de fundido (solo variantes cream/white). */
  tint?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const base =
    variant === "dark"
      ? editorialCardFadeOnDarkStyle()
      : editorialCardFadeStyle(
          tint ?? TINT[variant === "white" ? "white" : "cream"]
        );
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[1] ${className}`}
      style={{ ...base, ...style }}
      aria-hidden
    />
  );
}
