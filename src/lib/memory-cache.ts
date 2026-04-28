/**
 * Cache en memoria por instancia con TTL.
 *
 * Por qué existe: cada llamada a `list()` o `put()` de Vercel Blob cuenta como
 * "Advanced Request" (2,000/mes en el plan free). Para evitar quemar
 * operaciones en lecturas repetidas (hero, productos, recetas, pedidos…),
 * cacheamos el resultado dentro del proceso de la función serverless y lo
 * reusamos mientras siga "tibia".
 *
 * - El cache es por instancia: cada serverless function tiene su propia copia,
 *   pero Vercel reutiliza instancias varios minutos, así que en la práctica
 *   reducimos enormemente las lecturas.
 * - En writes hay que llamar a `bust()` o `set()` para invalidar/refrescar.
 */

export interface CacheEntry<T> {
  value: T;
  ts: number;
}

export class MemoryCache<T> {
  private entry: CacheEntry<T> | null = null;
  constructor(private readonly ttlMs: number) {}

  get(): T | null {
    if (!this.entry) return null;
    if (Date.now() - this.entry.ts > this.ttlMs) {
      this.entry = null;
      return null;
    }
    return this.entry.value;
  }

  set(value: T): void {
    this.entry = { value, ts: Date.now() };
  }

  bust(): void {
    this.entry = null;
  }
}
