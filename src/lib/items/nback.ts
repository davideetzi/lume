import { mulberry32 } from "./seed";

export const NBACK_LETTERS = ["A", "B", "C", "D", "F", "H", "K", "L"] as const;
export type NbackLetter = (typeof NBACK_LETTERS)[number];

/**
 * Genera una sequenza di lunghezza N con target rate ~30%.
 * Per ogni posizione i >= 2:
 *  - se rng < 0.30 -> imposta letter[i] = letter[i-2] (target)
 *  - altrimenti -> scegli una lettera diversa da letter[i-2] (non-target)
 */
export function generateNbackSequence(
  seed: string,
  length: number,
  targetRate = 0.3,
): { sequence: NbackLetter[]; targets: boolean[] } {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const rng = mulberry32(s + length);
  const seq: NbackLetter[] = [];
  const targets: boolean[] = [];
  for (let i = 0; i < length; i++) {
    if (i < 2) {
      seq.push(NBACK_LETTERS[Math.floor(rng() * NBACK_LETTERS.length)]!);
      targets.push(false);
      continue;
    }
    const isTarget = rng() < targetRate;
    if (isTarget) {
      seq.push(seq[i - 2]!);
      targets.push(true);
    } else {
      const others = NBACK_LETTERS.filter((l) => l !== seq[i - 2]);
      seq.push(others[Math.floor(rng() * others.length)]!);
      targets.push(false);
    }
  }
  return { sequence: seq, targets };
}

/**
 * d-prime su SDT a 2 alternative. clip per evitare +/-Infinity.
 */
export function dPrime(
  hits: number,
  misses: number,
  falseAlarms: number,
  correctRejections: number,
): number {
  const targetCount = hits + misses;
  const nonTargetCount = falseAlarms + correctRejections;
  if (targetCount === 0 || nonTargetCount === 0) return 0;
  const hitRate = clipRate(hits / targetCount, targetCount);
  const faRate = clipRate(falseAlarms / nonTargetCount, nonTargetCount);
  return inverseNormal(hitRate) - inverseNormal(faRate);
}

function clipRate(p: number, n: number): number {
  // standard adjustment per evitare 0/1
  if (p <= 0) return 0.5 / n;
  if (p >= 1) return 1 - 0.5 / n;
  return p;
}

// Beasley-Springer-Moro inverse normal approximation (sufficiente per UI).
function inverseNormal(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number, r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q +
        c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r +
        a[5]!) *
        q) /
      (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q +
        c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }
}
