import type { CSSProperties } from "react";

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return { r: 250, g: 249, b: 244 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

/** Hero (móvil): viñeta superior + fundido hacia el bloque crema a la izquierda. */
export function heroMainImageOverlayStyle(bgHex: string): CSSProperties {
  const { r, g, b } = hexToRgb(bgHex);
  return {
    background: [
      `linear-gradient(to top, rgba(${r},${g},${b},0.1) 0%, transparent 28%)`,
      `linear-gradient(to left, transparent 52%, rgba(${r},${g},${b},0.2) 80%, rgba(${r},${g},${b},0.32) 100%)`,
    ].join(", "),
  };
}

/** Hero en `md+`: viñeta superior ligera. */
export function heroMainImageOverlayStyleWeb(bgHex: string): CSSProperties {
  const { r, g, b } = hexToRgb(bgHex);
  return {
    background: `linear-gradient(to top, rgba(${r},${g},${b},0.045) 0%, transparent 30%)`,
  };
}

/** Franja inferior del hero (móvil): funde con la sección siguiente. */
export function heroBottomFadeStyle(bgHex: string): CSSProperties {
  const { r, g, b } = hexToRgb(bgHex);
  return {
    background: `linear-gradient(to top, rgba(${r},${g},${b},0.45) 0%, rgba(${r},${g},${b},0.18) 16%, rgba(${r},${g},${b},0.06) 38%, transparent 72%)`,
  };
}

/** Franja inferior del hero en `md+`: más ligera para fundir con la sección siguiente. */
export function heroBottomFadeStyleWeb(bgHex: string): CSSProperties {
  const { r, g, b } = hexToRgb(bgHex);
  return {
    background: `linear-gradient(to top, rgba(${r},${g},${b},0.2) 0%, rgba(${r},${g},${b},0.08) 18%, rgba(${r},${g},${b},0.025) 42%, transparent 76%)`,
  };
}

/**
 * Viñeta tipo hero en marcos (cards, collage): bordes que funden hacia `tintHex`.
 * Opacidades bajas para no “lavar” la foto.
 */
export function editorialCardFadeStyle(tintHex: string): CSSProperties {
  const { r, g, b } = hexToRgb(tintHex);
  return {
    background: [
      `linear-gradient(to top, rgba(${r},${g},${b},0.14) 0%, transparent 30%)`,
      `linear-gradient(to bottom, rgba(${r},${g},${b},0.06) 0%, transparent 24%)`,
      `linear-gradient(to left, rgba(${r},${g},${b},0.11) 0%, transparent 36%)`,
      `linear-gradient(to right, rgba(${r},${g},${b},0.07) 0%, transparent 32%)`,
    ].join(", "),
  };
}

/** Carrusel / cards sobre fondo oscuro (brand-primary). */
export function editorialCardFadeOnDarkStyle(): CSSProperties {
  const { r, g, b } = hexToRgb("#1D1D1B");
  return {
    background: [
      `linear-gradient(to top, rgba(${r},${g},${b},0.22) 0%, transparent 32%)`,
      `linear-gradient(to bottom, rgba(${r},${g},${b},0.12) 0%, transparent 24%)`,
      `linear-gradient(to left, rgba(${r},${g},${b},0.16) 0%, transparent 36%)`,
      `linear-gradient(to right, rgba(${r},${g},${b},0.1) 0%, transparent 30%)`,
    ].join(", "),
  };
}

/** Contacto (y similares): funde hacia panel oscuro, más suave que el degradado inline anterior. */
export function contactPhotoSplitFadeStyle(): CSSProperties {
  return {
    background: [
      "linear-gradient(to top, rgba(29,29,27,0.2) 0%, transparent 26%)",
      "linear-gradient(to right, transparent 58%, rgba(29,29,27,0.28) 82%, rgba(29,29,27,0.4) 100%)",
    ].join(", "),
  };
}
