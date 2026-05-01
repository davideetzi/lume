import { mulberry32 } from "./seed";

/**
 * Versione semplificata: un foglio quadrato 4x4 (16 celle), ogni piega
 * dimezza il foglio (orizzontale o verticale). Dopo 1-2 pieghe, vengono
 * forate alcune celle. La risposta corretta mostra il foglio "aperto" con
 * le forature simmetriche secondo le pieghe.
 *
 * Per semplicita produciamo:
 *  - una sequenza di 1-2 pieghe (lato + verso)
 *  - un set di forature in coordinate del foglio piegato
 *  - calcoliamo le forature dispiegate (simmetria specchiare per piega)
 *  - 4 opzioni: la corretta + 3 distrattori (forature mancanti, in piu, sbagliate)
 */

const GRID = 4;

export type Fold =
  | { axis: "h"; from: "top" | "bottom" }
  | { axis: "v"; from: "left" | "right" };

export type Hole = { x: number; y: number };

export type PaperFoldingItem = {
  folds: Fold[];
  holesAfterFolding: Hole[];
  unfoldedHoles: Hole[]; // soluzione corretta
  options: Hole[][];
  correctIndex: number;
  seed: string;
};

export function generatePaperFolding(seed: string): PaperFoldingItem {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const rng = mulberry32(s);

  const numFolds = (1 + Math.floor(rng() * 2)) as 1 | 2;
  const folds: Fold[] = [];
  for (let i = 0; i < numFolds; i++) {
    if (rng() < 0.5) {
      folds.push({ axis: "h", from: rng() < 0.5 ? "top" : "bottom" });
    } else {
      folds.push({ axis: "v", from: rng() < 0.5 ? "left" : "right" });
    }
  }

  // Dopo le pieghe, l'area visibile e la meta o un quarto. Genera 1-3 fori
  // in coordinate del foglio piegato (ridotto).
  const reducedW =
    folds.filter((f) => f.axis === "v").length > 0 ? GRID / 2 : GRID;
  const reducedH =
    folds.filter((f) => f.axis === "h").length > 0 ? GRID / 2 : GRID;

  const numHoles = 1 + Math.floor(rng() * 2);
  const holes: Hole[] = [];
  while (holes.length < numHoles) {
    const x = Math.floor(rng() * reducedW);
    const y = Math.floor(rng() * reducedH);
    if (!holes.some((h) => h.x === x && h.y === y)) {
      holes.push({ x, y });
    }
  }

  const unfoldedHoles = unfold(holes, folds);

  const options: Hole[][] = [unfoldedHoles];
  // distrattori
  while (options.length < 4) {
    const cand = perturbHoles(unfoldedHoles, rng);
    if (!options.some((o) => sameHoleSet(o, cand))) {
      options.push(cand);
    }
  }
  // shuffle options
  const order: number[] = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  const shuffled = order.map((i) => options[i]!);
  const correctIndex = order.indexOf(0);

  return {
    folds,
    holesAfterFolding: holes,
    unfoldedHoles,
    options: shuffled,
    correctIndex,
    seed,
  };
}

function unfold(holes: Hole[], folds: Fold[]): Hole[] {
  let current = [...holes];
  for (let i = folds.length - 1; i >= 0; i--) {
    const f = folds[i]!;
    const next: Hole[] = [];
    for (const h of current) {
      next.push(h);
      if (f.axis === "v") {
        next.push({ x: GRID - 1 - h.x, y: h.y });
      } else {
        next.push({ x: h.x, y: GRID - 1 - h.y });
      }
    }
    // dedupe
    current = dedupe(next);
  }
  return current;
}

function dedupe(holes: Hole[]): Hole[] {
  const seen = new Set<string>();
  const out: Hole[] = [];
  for (const h of holes) {
    const k = `${h.x},${h.y}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(h);
    }
  }
  return out;
}

function perturbHoles(orig: Hole[], rng: () => number): Hole[] {
  const choice = Math.floor(rng() * 3);
  if (choice === 0 && orig.length > 1) {
    // rimuovi un foro
    const skip = Math.floor(rng() * orig.length);
    return orig.filter((_, i) => i !== skip);
  } else if (choice === 1 && orig.length < GRID * GRID) {
    // aggiungi un foro
    let attempts = 20;
    while (attempts-- > 0) {
      const x = Math.floor(rng() * GRID);
      const y = Math.floor(rng() * GRID);
      if (!orig.some((h) => h.x === x && h.y === y)) {
        return [...orig, { x, y }];
      }
    }
  }
  // sposta un foro
  const idx = Math.floor(rng() * orig.length);
  const target = orig[idx]!;
  const dx = Math.random() < 0.5 ? 1 : -1;
  const x = Math.max(0, Math.min(GRID - 1, target.x + dx));
  return orig.map((h, i) => (i === idx ? { x, y: h.y } : h));
}

function sameHoleSet(a: Hole[], b: Hole[]): boolean {
  if (a.length !== b.length) return false;
  const ka = new Set(a.map((h) => `${h.x},${h.y}`));
  return b.every((h) => ka.has(`${h.x},${h.y}`));
}

export const PAPER_GRID = GRID;
