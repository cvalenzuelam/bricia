export const FREE_SHIPPING_THRESHOLD = 1500;

export interface ShippingOption {
  id: string;
  name: string;
  eta: string;
  price: number;
}

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "estafeta_terrestre",
    name: "Estafeta Terrestre",
    eta: "3-5 dias habiles",
    price: 150,
  },
  {
    id: "dhl_express",
    name: "DHL Express",
    eta: "1-3 dias habiles",
    price: 195,
  },
];

export const DEFAULT_SHIPPING_OPTION_ID = SHIPPING_OPTIONS[0].id;

export function getShippingOptionById(id?: string): ShippingOption {
  return SHIPPING_OPTIONS.find((option) => option.id === id) ?? SHIPPING_OPTIONS[0];
}

/** Activa envío $0 en checkout y en POST /api/orders (variable `NEXT_PUBLIC_CHECKOUT_ZERO_SHIPPING`). */
export function isCheckoutZeroShippingForced(): boolean {
  const v = process.env.NEXT_PUBLIC_CHECKOUT_ZERO_SHIPPING?.trim().toLowerCase();
  return v === "true" || v === "1";
}

export function calculateShipping(subtotal: number, baseShippingPrice: number): number {
  if (isCheckoutZeroShippingForced()) return 0;
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : baseShippingPrice;
}

export function formatPriceMXN(price: number): string {
  return `$${price.toLocaleString("es-MX")} MXN`;
}
