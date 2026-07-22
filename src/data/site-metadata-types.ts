export type SiteMetadataConfig = {
  title: string;
  description: string;
  ogImageSrc: string;
  ogImageAlt: string;
  /** Favicon (PNG/SVG/ICO). Vacío = sin favicon personalizado. */
  faviconSrc: string;
};

export const DEFAULT_SITE_METADATA: SiteMetadataConfig = {
  title: "Bricia | Recetas con Historias",
  description: "Recetario personal de Bricia. Cocina con amor, historias que alimentan.",
  ogImageSrc: "/images/og-default.jpg",
  ogImageAlt: "Bricia | Recetas con Historias",
  faviconSrc: "",
};
