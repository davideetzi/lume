import { mulberry32 } from "./seed";

/**
 * Generatore Shepard-Metzler-style: "L-shape" o "Z-shape" composti da 8-10
 * cubi disposti in una catena 3D. Il rendering e isometrico 2D.
 *
 * Strategia: l'oggetto e una catena di voxel (x,y,z) generata con random walk
 * 3D, evitando self-overlap. La rotazione e applicata come matrice 3x3
 * intorno agli assi.
 *
 * Item: due immagini, l'utente decide se sono lo stesso oggetto ruotato o
 * uno specchio.
 */

export type Voxel = { x: number; y: number; z: number };

export function generateChain(seed: string, length = 9): Voxel[] {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const rng = mulberry32(s);
  const dirs: [number, number, number][] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  const occupied = new Set<string>();
  const chain: Voxel[] = [{ x: 0, y: 0, z: 0 }];
  occupied.add("0,0,0");

  let lastDir = -1;
  for (let i = 1; i < length; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 30 && !placed; attempt++) {
      const dirIdx = Math.floor(rng() * dirs.length);
      // evita di tornare indietro
      if (dirIdx === lastDir) continue;
      const [dx, dy, dz] = dirs[dirIdx]!;
      const last = chain[chain.length - 1]!;
      const next = { x: last.x + dx!, y: last.y + dy!, z: last.z + dz! };
      const k = `${next.x},${next.y},${next.z}`;
      if (!occupied.has(k)) {
        chain.push(next);
        occupied.add(k);
        lastDir = dirIdx;
        placed = true;
      }
    }
    if (!placed) break;
  }
  return chain;
}

export type Mat3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export function rotateAroundY(degrees: number): Mat3 {
  const a = (degrees * Math.PI) / 180;
  const c = Math.round(Math.cos(a));
  const s = Math.round(Math.sin(a));
  return [
    [c, 0, s],
    [0, 1, 0],
    [-s, 0, c],
  ];
}

export function rotateAroundX(degrees: number): Mat3 {
  const a = (degrees * Math.PI) / 180;
  const c = Math.round(Math.cos(a));
  const s = Math.round(Math.sin(a));
  return [
    [1, 0, 0],
    [0, c, -s],
    [0, s, c],
  ];
}

export function rotateAroundZ(degrees: number): Mat3 {
  const a = (degrees * Math.PI) / 180;
  const c = Math.round(Math.cos(a));
  const s = Math.round(Math.sin(a));
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
}

export function multMat(a: Mat3, b: Mat3): Mat3 {
  const out: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      out[i]![j] = a[i]![0]! * b[0]![j]! + a[i]![1]! * b[1]![j]! + a[i]![2]! * b[2]![j]!;
  return out as Mat3;
}

export function applyMat(m: Mat3, v: Voxel): Voxel {
  return {
    x: m[0]![0]! * v.x + m[0]![1]! * v.y + m[0]![2]! * v.z,
    y: m[1]![0]! * v.x + m[1]![1]! * v.y + m[1]![2]! * v.z,
    z: m[2]![0]! * v.x + m[2]![1]! * v.y + m[2]![2]! * v.z,
  };
}

export function mirror(v: Voxel): Voxel {
  return { x: -v.x, y: v.y, z: v.z };
}

export type RotationPair = {
  base: Voxel[];
  rotated: Voxel[];
  same: boolean;
  rotation: { axis: "X" | "Y" | "Z"; degrees: number };
  seed: string;
};

export function generateMentalRotationItem(seed: string): RotationPair {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const rng = mulberry32(s);
  const base = generateChain(`${seed}::shape`, 8);

  const same = rng() < 0.5;
  const axes = ["X", "Y", "Z"] as const;
  const axis = axes[Math.floor(rng() * 3)]!;
  const degrees = ([90, 180, 270] as const)[Math.floor(rng() * 3)]!;

  const rotMat =
    axis === "X"
      ? rotateAroundX(degrees)
      : axis === "Y"
        ? rotateAroundY(degrees)
        : rotateAroundZ(degrees);

  const transformed = same
    ? base.map((v) => applyMat(rotMat, v))
    : base.map((v) => applyMat(rotMat, mirror(v)));

  return {
    base,
    rotated: transformed,
    same,
    rotation: { axis, degrees },
    seed,
  };
}

/** Proiezione isometrica per render 2D. */
export function project(v: Voxel, scale = 18): { x: number; y: number; z: number } {
  // standard isometric: X -> right-down, Y -> right-up, Z -> up
  const x = (v.x - v.y) * Math.cos(Math.PI / 6) * scale;
  const y = ((v.x + v.y) * Math.sin(Math.PI / 6) - v.z) * scale;
  const depth = v.x + v.y + v.z; // per painter sort
  return { x, y, z: depth };
}
