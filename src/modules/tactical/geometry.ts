import type { ArenaMap, Point } from '../../../contracts/tactical-types.js';
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
/** First segment intersection fraction, including inflated cover. */
export function wallHit(a: Point, b: Point, map: ArenaMap, r = 0): number {
    let first = Infinity;
    for (const q of map.blockers) {
        let lo = 0, hi = 1;
        for (const [p, d, min, max] of [[a.x, b.x - a.x, q.x - q.w / 2 - r, q.x + q.w / 2 + r], [a.z, b.z - a.z, q.z - q.d / 2 - r, q.z + q.d / 2 + r]]) {
            if (Math.abs(d!) < 1e-10) {
                if (p! < min! || p! > max!) {
                    lo = 2;
                    break;
                }
            }
            else {
                const t1 = (min! - p!) / d!, t2 = (max! - p!) / d!;
                lo = Math.max(lo, Math.min(t1, t2));
                hi = Math.min(hi, Math.max(t1, t2));
            }
        }
        if (lo <= hi && hi >= 0 && lo <= 1)
            first = Math.min(first, Math.max(0, lo));
    }
    return first;
}
export const clear = (a: Point, b: Point, map: ArenaMap, r = 0) => wallHit(a, b, map, r) === Infinity;
export function bounded(p: Point, map: ArenaMap, r: number): Point { return { x: Math.max(r, Math.min(map.width - r, p.x)), z: Math.max(r, Math.min(map.depth - r, p.z)) }; }
export function legal(p: Point, map: ArenaMap, r: number) { return p.x >= r && p.x <= map.width - r && p.z >= r && p.z <= map.depth - r && clear(p, p, map, r); }
/** Deterministic visibility graph around inflated rectangular cover. */
export function route(a: Point, b: Point, map: ArenaMap, r: number): Point[] {
    b = bounded(b, map, r);
    if (!legal(b, map, r))
        return [];
    if (clear(a, b, map, r))
        return [b];
    const nodes: Point[] = [a, b];
    const pad = r + 0.025;
    for (const q of map.blockers)
        for (const sx of [-1, 1])
            for (const sz of [-1, 1]) {
                const p = { x: q.x + sx * (q.w / 2 + pad), z: q.z + sz * (q.d / 2 + pad) };
                if (legal(p, map, r))
                    nodes.push(p);
            }
    const costs = nodes.map(() => Infinity), prev = nodes.map(() => -1), done = new Set<number>();
    costs[0] = 0;
    while (done.size < nodes.length) {
        let u = -1;
        for (let i = 0; i < nodes.length; i++)
            if (!done.has(i) && (u < 0 || costs[i]! < costs[u]!))
                u = i;
        if (u < 0 || !Number.isFinite(costs[u]))
            break;
        if (u === 1)
            break;
        done.add(u);
        for (let v = 0; v < nodes.length; v++)
            if (!done.has(v) && clear(nodes[u]!, nodes[v]!, map, r)) {
                const c = costs[u]! + distance(nodes[u]!, nodes[v]!);
                if (c < costs[v]!) {
                    costs[v] = c;
                    prev[v] = u;
                }
            }
    }
    if (!Number.isFinite(costs[1]))
        return [];
    const path: Point[] = [];
    for (let v = 1; v !== 0; v = prev[v]!)
        path.unshift(nodes[v]!);
    return path;
}
export function circleHit(a: Point, b: Point, c: Point, r: number): number {
    const dx = b.x - a.x, dz = b.z - a.z, fx = a.x - c.x, fz = a.z - c.z, A = dx * dx + dz * dz, C = fx * fx + fz * fz - r * r;
    if (C <= 0)
        return 0;
    if (A === 0)
        return Infinity;
    const B = 2 * (fx * dx + fz * dz), disc = B * B - 4 * A * C;
    if (disc < 0)
        return Infinity;
    const t = (-B - Math.sqrt(disc)) / (2 * A);
    return t >= 0 && t <= 1 ? t : Infinity;
}
