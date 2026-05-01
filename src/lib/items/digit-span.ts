import { mulberry32 } from "./seed";

/**
 * Genera una sequenza di N cifre 0-9 senza ripetizioni adiacenti.
 */
export function generateDigitSequence(seed: string, length: number): number[] {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const rng = mulberry32(s + length);
  const out: number[] = [];
  while (out.length < length) {
    const d = Math.floor(rng() * 10);
    if (out.length === 0 || out[out.length - 1] !== d) {
      out.push(d);
    }
  }
  return out;
}

export function reverseSequence(seq: number[]): number[] {
  return [...seq].reverse();
}

export type DigitSpanState = {
  level: number; // lunghezza corrente
  attemptsAtLevel: number; // tentativi al livello corrente
  successesAtLevel: number;
  failuresAtLevel: number;
  totalCorrect: number;
  totalAttempts: number;
  maxLevelReached: number; // span massimo
  done: boolean;
};

export function initialState(startLevel = 3): DigitSpanState {
  return {
    level: startLevel,
    attemptsAtLevel: 0,
    successesAtLevel: 0,
    failuresAtLevel: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    maxLevelReached: startLevel - 1,
    done: false,
  };
}

/**
 * Aggiorna lo stato dopo un tentativo. Regole:
 *  - 2 successi consecutivi al livello -> sali di 1 (max 9)
 *  - 2 fallimenti totali al livello -> stop
 */
export function applyAttempt(
  state: DigitSpanState,
  correct: boolean,
): DigitSpanState {
  if (state.done) return state;
  const next: DigitSpanState = {
    ...state,
    attemptsAtLevel: state.attemptsAtLevel + 1,
    totalAttempts: state.totalAttempts + 1,
    totalCorrect: state.totalCorrect + (correct ? 1 : 0),
  };
  if (correct) {
    next.successesAtLevel = state.successesAtLevel + 1;
    if (next.successesAtLevel >= 2) {
      next.maxLevelReached = Math.max(state.maxLevelReached, state.level);
      if (state.level >= 9) {
        next.done = true;
      } else {
        next.level = state.level + 1;
        next.attemptsAtLevel = 0;
        next.successesAtLevel = 0;
        next.failuresAtLevel = 0;
      }
    }
  } else {
    next.failuresAtLevel = state.failuresAtLevel + 1;
    if (next.failuresAtLevel >= 2) {
      next.done = true;
    }
  }
  return next;
}
