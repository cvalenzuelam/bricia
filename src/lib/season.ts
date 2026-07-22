/** Estaciones meteorológicas (hemisferio norte / México). */

export const SEASON_FILTERS = [
  "PRIMAVERA",
  "VERANO",
  "OTOÑO",
  "INVIERNO",
] as const;

export type SeasonFilter = (typeof SEASON_FILTERS)[number];

/**
 * Estación actual según el calendario culinario en zona México.
 * Primavera Mar–May · Verano Jun–Ago · Otoño Sep–Nov · Invierno Dic–Feb
 */
export function getCurrentSeasonCategory(
  date: Date = new Date()
): SeasonFilter {
  const month = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Mexico_City",
      month: "numeric",
    }).format(date)
  );

  if (month >= 3 && month <= 5) return "PRIMAVERA";
  if (month >= 6 && month <= 8) return "VERANO";
  if (month >= 9 && month <= 11) return "OTOÑO";
  return "INVIERNO";
}
