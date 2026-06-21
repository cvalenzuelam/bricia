export type ShopConfig = {
  comingSoon: boolean;
  title: string;
  subtitle: string;
  message: string;
};

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  comingSoon: false,
  title: "Próximamente",
  subtitle: "Nuestra alacena está tomando forma",
  message:
    "Estamos seleccionando piezas con alma para tu mesa. Muy pronto podrás explorarlas aquí.",
};

export function normalizeShopConfig(raw: unknown): ShopConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SHOP_CONFIG };

  const o = raw as Record<string, unknown>;
  return {
    comingSoon: o.comingSoon === true,
    title:
      typeof o.title === "string" && o.title.trim()
        ? o.title.trim()
        : DEFAULT_SHOP_CONFIG.title,
    subtitle:
      typeof o.subtitle === "string" && o.subtitle.trim()
        ? o.subtitle.trim()
        : DEFAULT_SHOP_CONFIG.subtitle,
    message:
      typeof o.message === "string" && o.message.trim()
        ? o.message.trim()
        : DEFAULT_SHOP_CONFIG.message,
  };
}
