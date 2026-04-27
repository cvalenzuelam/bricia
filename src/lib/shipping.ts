export const SHIPPING_FLAT_RATE = 200;
export const FREE_SHIPPING_THRESHOLD = 1500;

export function calculateShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
}

export function formatPriceMXN(price: number): string {
  return `$${price.toLocaleString("es-MX")} MXN`;
}
