import { createHash } from 'node:crypto';

/** Sorted object keys, preserved array order, finite JSON numbers, -0 becomes 0. */
export function canonical(value: unknown): string {
  const active = new Set<object>();
  function visit(item: unknown): string {
    if (item === null || typeof item === 'boolean' || typeof item === 'string') return JSON.stringify(item);
    if (typeof item === 'number' && Number.isFinite(item)) return JSON.stringify(item);
    if (typeof item !== 'object' || item === null || active.has(item)) throw new Error('Expected finite acyclic JSON');
    active.add(item);
    let result: string;
    if (Array.isArray(item)) {
      // Holes and undefined are rejected instead of silently changing meaning.
      result = '[' + Array.from(item, visit).join(',') + ']';
    } else {
      if (Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) throw new Error('Expected plain JSON object');
      result = '{' + Object.keys(item).sort().map(key => JSON.stringify(key) + ':' + visit((item as Record<string, unknown>)[key])).join(',') + '}';
    }
    active.delete(item);
    return result;
  }
  return visit(value);
}
export function hash(value: unknown): string { return createHash('sha256').update(canonical(value)).digest('hex'); }
export function clone<T>(value: T): T { return JSON.parse(canonical(value)) as T; }
export function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
/** xorshift32 (13,17,5); explicit nonzero uint32 state. */
export function nextRandom(state: number): number {
  let x = state >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return x >>> 0;
}
export function streamSeed(seed: number, name: string): number {
  return Number.parseInt(hash({seed, name}).slice(0, 8), 16) || 0x6d2b79f5;
}
