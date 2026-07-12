export type SiteMetadataConfig = {
  title: string;
  description: string;
  ogImageSrc: string;
  ogImageAlt: string;
};

export const DEFAULT_SITE_METADATA: SiteMetadataConfig = {
  title: "Bricia | Recetas con Historias",
  description: "Recetario personal de Bricia. Cocina con amor, historias que alimentan.",
  ogImageSrc: "",
  ogImageAlt: "Bricia | Recetas con Historias",
};
