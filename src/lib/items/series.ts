import {
  pickOne,
  randInt,
  rngFromString,
  shuffle,
  type Rng,
} from "./seed";
import {
  COLORS,
  ROTATIONS,
  SHAPES,
  type Cell,
} from "./matrix";

/**
 * Serie figurali Gf, generazione procedurale.
 *
 * Una sequenza di 5 celle segue una regola; l'utente sceglie la 6a.
 * Regole disponibili:
 *  - SHAPE_ROTATE: la forma cicla nell'array SHAPES per ogni step
 *  - COUNT_PROGRESS: il count cicla 1->2->3->1->2->3
 *  - COLOR_ROTATE: il colore cicla in COLORS
 *  - ROTATE_PROGRESS: la rotazione avanza di +90 ad ogni step
 *
 * Difficolta = numero di regole simultanee attive (1, 2, 3).
 */

export type SeriesRule =
  | "SHAPE_ROTATE"
  | "COUNT_PROGRESS"
  | "COLOR_ROTATE"
  | "ROTATE_PROGRESS";

export const SERIES_RULES: readonly SeriesRule[] = [
  "SHAPE_ROTATE",
  "COUNT_PROGRESS",
  "COLOR_ROTATE",
  "ROTATE_PROGRESS",
];

export type SeriesItem = {
  sequence: Cell[]; // 5 celle visibili
  options: Cell[];  // 4 opzioni (la 6a)
  correctIndex: number;
  rules: SeriesRule[];
  difficulty: 1 | 2 | 3;
  seed: string;
};

const SEQ_LEN = 5;

export function generateSeries({
  seed,
  difficulty,
}: {
  seed: string;
  difficulty: 1 | 2 | 3;
}): SeriesItem {
  const rng = rngFromString(seed);
  const rules = pickRules(rng, difficulty);
  const start: Cell = {
    shape: pickOne(rng, SHAPES),
    color: pickOne(rng, COLORS),
    count: randInt(rng, 1, 3) as 1 | 2 | 3,
    rotation: pickOne(rng, ROTATIONS),
  };
  const allCells: Cell[] = [start];
  for (let i = 1; i < SEQ_LEN + 1; i++) {
    allCells.push(applyRules(allCells[i - 1]!, rules, i));
  }
  const sequence = allCells.slice(0, SEQ_LEN);
  const correct = allCells[SEQ_LEN]!;

  // 3 distrattori che rompono una regola
  const distractors = buildDistractors(rng, correct, rules);
  const optionsRaw: Cell[] = [correct, ...distractors];
  const order = shuffle(rng, optionsRaw.map((_, i) => i));
  const options = order.map((i) => optionsRaw[i]!);
  const correctIndex = order.indexOf(0);

  return { sequence, options, correctIndex, rules, difficulty, seed };
}

function pickRules(rng: Rng, n: 1 | 2 | 3): SeriesRule[] {
  const pool = [...SERIES_RULES];
  const out: SeriesRule[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

function applyRules(c: Cell, rules: SeriesRule[], step: number): Cell {
  let next: Cell = { ...c };
  if (rules.includes("SHAPE_ROTATE")) {
    const i = (SHAPES.indexOf(c.shape) + 1) % SHAPES.length;
    next = { ...next, shape: SHAPES[i]! };
  }
  if (rules.includes("COUNT_PROGRESS")) {
    next = { ...next, count: ((c.count % 3) + 1) as 1 | 2 | 3 };
  }
  if (rules.includes("COLOR_ROTATE")) {
    const i = (COLORS.indexOf(c.color) + 1) % COLORS.length;
    next = { ...next, color: COLORS[i]! };
  }
  if (rules.includes("ROTATE_PROGRESS")) {
    const i = (ROTATIONS.indexOf(c.rotation) + 1) % ROTATIONS.length;
    next = { ...next, rotation: ROTATIONS[i]! };
  }
  void step;
  return next;
}

function buildDistractors(
  rng: Rng,
  correct: Cell,
  rules: SeriesRule[],
): Cell[] {
  const out: Cell[] = [];
  const seen = new Set<string>([key(correct)]);
  const pool = rules.length > 0 ? rules : SERIES_RULES;
  let safety = 30;
  while (out.length < 3 && safety-- > 0) {
    const r = pickOne(rng, pool);
    const cand = perturb(rng, correct, r);
    const k = key(cand);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(cand);
    }
  }
  while (out.length < 3) {
    const cand: Cell = {
      shape: pickOne(rng, SHAPES),
      color: pickOne(rng, COLORS),
      count: randInt(rng, 1, 3) as 1 | 2 | 3,
      rotation: pickOne(rng, ROTATIONS),
    };
    const k = key(cand);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(cand);
    }
  }
  return out;
}

function perturb(rng: Rng, c: Cell, rule: SeriesRule): Cell {
  switch (rule) {
    case "SHAPE_ROTATE": {
      const others = SHAPES.filter((s) => s !== c.shape);
      return { ...c, shape: pickOne(rng, others) };
    }
    case "COUNT_PROGRESS": {
      const others = ([1, 2, 3] as const).filter((n) => n !== c.count);
      return { ...c, count: pickOne(rng, others) };
    }
    case "COLOR_ROTATE": {
      const others = COLORS.filter((co) => co !== c.color);
      return { ...c, color: pickOne(rng, others) };
    }
    case "ROTATE_PROGRESS": {
      const others = ROTATIONS.filter((r) => r !== c.rotation);
      return { ...c, rotation: pickOne(rng, others) };
    }
  }
}

function key(c: Cell): string {
  return `${c.shape}|${c.color}|${c.count}|${c.rotation}`;
}

export function seriesDifficultyForTrial(idx: number): 1 | 2 | 3 {
  if (idx < 4) return 1;
  if (idx < 8) return 2;
  return 3;
}
