import {
  pickMany,
  pickOne,
  randInt,
  rngFromString,
  shuffle,
  type Rng,
} from "./seed";

/**
 * Matrici figurali Gf, generazione procedurale.
 *
 * Modello: griglia 3x3, ogni cella e una "figura" descritta da
 *   { shape, color, count, rotation }
 * Le righe/colonne seguono regole compositive scelte tra:
 *   - PROGRESSION_SHAPE   (la forma cambia in modo costante per riga)
 *   - PROGRESSION_COUNT   (il conteggio aumenta per riga)
 *   - DISTRIBUTION_COLOR  (i 3 colori compaiono una volta per riga e per colonna,
 *                           come in un Sudoku)
 *   - ROTATION            (rotazione costante per colonna)
 *
 * La cella in basso a destra (2,2) e la risposta. Vengono generate 4 alternative:
 *   - quella corretta
 *   - 3 distrattori che violano una delle regole attive
 *
 * Difficolta = numero di regole simultanee (1, 2, 3).
 */

export const SHAPES = ["circle", "triangle", "square", "diamond"] as const;
export type Shape = (typeof SHAPES)[number];

export const COLORS = ["#233460", "#3bb8b9", "#8a939a"] as const;
export type Color = (typeof COLORS)[number];

export const ROTATIONS = [0, 90, 180, 270] as const;
export type Rotation = (typeof ROTATIONS)[number];

export type Cell = {
  shape: Shape;
  color: Color;
  count: 1 | 2 | 3;
  rotation: Rotation;
};

export type Rule =
  | "PROGRESSION_SHAPE"
  | "PROGRESSION_COUNT"
  | "DISTRIBUTION_COLOR"
  | "ROTATION";

export const ALL_RULES: readonly Rule[] = [
  "PROGRESSION_SHAPE",
  "PROGRESSION_COUNT",
  "DISTRIBUTION_COLOR",
  "ROTATION",
];

export type MatrixItem = {
  /** matrice 3x3, l'ultima cella e la "soluzione" e va nascosta in UI */
  grid: Cell[][];
  /** opzioni di risposta, l'indice 0 e sempre la soluzione (mescola in UI) */
  options: Cell[];
  /** indice della risposta corretta dopo lo shuffle */
  correctIndex: number;
  rules: Rule[];
  difficulty: 1 | 2 | 3;
  seed: string;
};

const ROWS = 3;
const COLS = 3;

export type MatrixDifficulty = 1 | 2 | 3;

export type GenerateMatrixOptions = {
  seed: string;
  difficulty: MatrixDifficulty;
};

export function generateMatrix({
  seed,
  difficulty,
}: GenerateMatrixOptions): MatrixItem {
  const rng = rngFromString(seed);

  const rules = pickMany(rng, ALL_RULES, difficulty);
  const grid = buildGrid(rng, rules);
  const correct = grid[ROWS - 1]![COLS - 1]!;
  const distractors = buildDistractors(rng, grid, rules);

  // Mescola opzioni mantenendo traccia dell'indice corretto.
  const optionsRaw: Cell[] = [correct, ...distractors];
  const order = shuffle(rng, optionsRaw.map((_, i) => i));
  const options = order.map((i) => optionsRaw[i]!);
  const correctIndex = order.indexOf(0);

  return {
    grid,
    options,
    correctIndex,
    rules,
    difficulty,
    seed,
  };
}

function buildGrid(rng: Rng, rules: Rule[]): Cell[][] {
  // valori "base" che possono essere modificati dalle regole
  const baseShape: Shape = pickOne(rng, SHAPES);
  const baseColor: Color = pickOne(rng, COLORS);
  const baseCount: 1 | 2 | 3 = randInt(rng, 1, 3) as 1 | 2 | 3;
  const baseRotation: Rotation = pickOne(rng, ROTATIONS);

  // permutazione colori per la regola "distribution color"
  const colorPerm = shuffle(rng, COLORS);

  const grid: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) {
      let shape = baseShape;
      let color = baseColor;
      let count: 1 | 2 | 3 = baseCount;
      let rotation = baseRotation;

      if (rules.includes("PROGRESSION_SHAPE")) {
        // shape varia per colonna in modo costante
        const idx = (SHAPES.indexOf(baseShape) + c) % SHAPES.length;
        shape = SHAPES[idx]!;
      }
      if (rules.includes("PROGRESSION_COUNT")) {
        // count parte da 1 e cresce per riga
        count = (((r + 0) % 3) + 1) as 1 | 2 | 3;
      }
      if (rules.includes("DISTRIBUTION_COLOR")) {
        // sudoku 3x3 sui 3 colori: cella (r,c) -> colorPerm[(r+c) % 3]
        color = colorPerm[(r + c) % 3]!;
      }
      if (rules.includes("ROTATION")) {
        // rotazione cresce per colonna a step di 90
        rotation = (((ROTATIONS.indexOf(baseRotation) + c) % 4) * 90) as Rotation;
      }

      row.push({ shape, color, count, rotation });
    }
    grid.push(row);
  }
  return grid;
}

function buildDistractors(
  rng: Rng,
  grid: Cell[][],
  rules: Rule[],
): Cell[] {
  const correct = grid[ROWS - 1]![COLS - 1]!;
  const distractors: Cell[] = [];
  const tried = new Set<string>([cellKey(correct)]);

  // Ogni distrattore viola UNA regola attiva (se ce n'e almeno una).
  // Se restano spazi, fallback su perturbazioni random.
  const perturbations = rules.length > 0 ? rules : (ALL_RULES as Rule[]);

  let safety = 50;
  while (distractors.length < 3 && safety-- > 0) {
    const ruleToBreak = pickOne(rng, perturbations);
    const candidate = perturb(rng, correct, ruleToBreak);
    const key = cellKey(candidate);
    if (!tried.has(key)) {
      tried.add(key);
      distractors.push(candidate);
    }
  }

  // Fallback: variazioni random uniche
  while (distractors.length < 3) {
    const candidate = randomCell(rng);
    const key = cellKey(candidate);
    if (!tried.has(key)) {
      tried.add(key);
      distractors.push(candidate);
    }
  }

  return distractors;
}

function perturb(rng: Rng, src: Cell, rule: Rule): Cell {
  switch (rule) {
    case "PROGRESSION_SHAPE": {
      const others = SHAPES.filter((s) => s !== src.shape);
      return { ...src, shape: pickOne(rng, others) };
    }
    case "PROGRESSION_COUNT": {
      const others = ([1, 2, 3] as const).filter((n) => n !== src.count);
      return { ...src, count: pickOne(rng, others) };
    }
    case "DISTRIBUTION_COLOR": {
      const others = COLORS.filter((c) => c !== src.color);
      return { ...src, color: pickOne(rng, others) };
    }
    case "ROTATION": {
      const others = ROTATIONS.filter((r) => r !== src.rotation);
      return { ...src, rotation: pickOne(rng, others) };
    }
  }
}

function randomCell(rng: Rng): Cell {
  return {
    shape: pickOne(rng, SHAPES),
    color: pickOne(rng, COLORS),
    count: randInt(rng, 1, 3) as 1 | 2 | 3,
    rotation: pickOne(rng, ROTATIONS),
  };
}

function cellKey(c: Cell): string {
  return `${c.shape}|${c.color}|${c.count}|${c.rotation}`;
}

/**
 * Difficolta crescente nel blocco: i primi 7 trial = difficolta 1, i 7
 * successivi = difficolta 2, gli ultimi 6 = difficolta 3.
 */
export function difficultyForTrial(trialIndex: number): MatrixDifficulty {
  if (trialIndex < 7) return 1;
  if (trialIndex < 14) return 2;
  return 3;
}
