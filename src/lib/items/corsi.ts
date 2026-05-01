import { mulberry32, randInt } from "./seed";

/**
 * Disposizione di 9 blocchi non simmetrica nel rettangolo 0..1 x 0..1.
 * Coordinate fisse, scelte per evitare allineamenti banali.
 */
export const CORSI_BLOCKS: readonly { id: number; x: number; y: number }[] = [
  { id: 0, x: 0.10, y: 0.18 },
  { id: 1, x: 0.42, y: 0.10 },
  { id: 2, x: 0.78, y: 0.22 },
  { id: 3, x: 0.20, y: 0.50 },
  { id: 4, x: 0.55, y: 0.42 },
  { id: 5, x: 0.85, y: 0.55 },
  { id: 6, x: 0.12, y: 0.82 },
  { id: 7, x: 0.46, y: 0.78 },
  { id: 8, x: 0.80, y: 0.88 },
];

/**
 * Genera una sequenza di N blocchi distinti consecutivamente non identici.
 * Usa Fisher-Yates parziale via PRNG seedato.
 */
export function generateCorsiSequence(seed: string, length: number): number[] {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const rng = mulberry32(s + length);
  const out: number[] = [];
  while (out.length < length) {
    const next = randInt(rng, 0, 8);
    if (out.length === 0 || out[out.length - 1] !== next) {
      out.push(next);
    }
  }
  return out;
}
