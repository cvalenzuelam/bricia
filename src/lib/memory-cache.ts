/**
 * Cache en memoria por instancia con TTL.
 *
 * Reduce lecturas repetidas a Postgres o archivos dentro de procesos serverless:
 * reusamos el resultado mientras el TTL siga vigente.
 * Invalidar o refrescar con bust() / set() tras escrituras.
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
