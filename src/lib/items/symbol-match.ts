import { mulberry32 } from "./seed";

/**
 * Genera un simbolo astratto come stringa SVG path. Lo schema:
 *  - inizia da un punto random in un grid 6x6
 *  - traccia 4-6 segmenti tramite L (lineTo) verso celle vicine
 *  - stessa seed = stesso path
 */
export type Symbol = {
  d: string; // svg path
  size: number;
};

const GRID_PX = 60;
const STEPS_MIN = 4;
const STEPS_MAX = 7;

function symbolFromSeed(seed: string): Symbol {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const rng = mulberry32(s);
  const cells = 6;
  const cellSize = GRID_PX / cells;

  let x = Math.floor(rng() * cells);
  let y = Math.floor(rng() * cells);
  const points: [number, number][] = [[x, y]];
  const steps = STEPS_MIN + Math.floor(rng() * (STEPS_MAX - STEPS_MIN));
  for (let i = 0; i < steps; i++) {
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ];
    const [dx, dy] = dirs[Math.floor(rng() * dirs.length)]!;
    x = Math.max(0, Math.min(cells - 1, x + dx!));
    y = Math.max(0, Math.min(cells - 1, y + dy!));
    points.push([x, y]);
  }

  let d = "";
  points.forEach((p, i) => {
    const px = p[0]! * cellSize + cellSize / 2;
    const py = p[1]! * cellSize + cellSize / 2;
    d += `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)} `;
  });
  return { d: d.trim(), size: GRID_PX };
}

export type SymbolMatchItem = {
  left: Symbol;
  right: Symbol;
  same: boolean;
  seed: string;
};

/**
 * Genera una coppia di simboli. Con probabilita 0.5 sono identici,
 * altrimenti il secondo e generato da una seed diversa.
 */
export function generateSymbolMatch(seed: string): SymbolMatchItem {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const rng = mulberry32(s);
  const same = rng() < 0.5;
  const left = symbolFromSeed(`${seed}::L`);
  const right = same
    ? left
    : symbolFromSeed(`${seed}::R::${Math.floor(rng() * 1e9)}`);
  return { left, right, same, seed };
}
