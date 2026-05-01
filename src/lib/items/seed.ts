/**
 * PRNG deterministico mulberry32. Stessa seed = stessa sequenza.
 * Usato per generare item proceduralmente con riproducibilita.
 *
 * Vedi: https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 */
export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return function rand(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Crea un PRNG da una seed string (hash semplice). Utile per derivare seed
 * leggibili come "matrix-trial-7" mantenendo riproducibilita.
 */
export function rngFromString(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = (h ^ seed.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return mulberry32(h);
}

export type Rng = () => number;

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickOne<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

export function pickMany<T>(rng: Rng, arr: readonly T[], count: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]!);
  }
  return out;
}

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Genera una seed string canonica per il trial N di un task in una sessione.
 * Permette di riprodurre l'item esatto a partire dai metadati salvati.
 */
export function trialSeed(
  sessionId: string,
  taskCode: string,
  index: number,
): string {
  return `${sessionId}::${taskCode}::${index}`;
}
