import { describe, expect, it } from "vitest";
import {
  mulberry32,
  pickOne,
  randInt,
  rngFromString,
  shuffle,
  trialSeed,
} from "@/lib/items/seed";

describe("mulberry32", () => {
  it("produce sequenze identiche per la stessa seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produce sequenze diverse per seed diverse", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("restituisce numeri in [0,1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("rngFromString", () => {
  it("seed string identica produce sequenza identica", () => {
    const a = rngFromString("matrix-trial-1");
    const b = rngFromString("matrix-trial-1");
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it("seed string diverse producono sequenze diverse", () => {
    const a = rngFromString("matrix-trial-1");
    const b = rngFromString("matrix-trial-2");
    expect(a()).not.toBe(b());
  });
});

describe("trialSeed", () => {
  it("formato canonico", () => {
    expect(trialSeed("sess-abc", "matrix", 3)).toBe("sess-abc::matrix::3");
  });

  it("alimenta PRNG riproducibile", () => {
    const seed = trialSeed("sess-1", "series", 0);
    const a = rngFromString(seed)();
    const b = rngFromString(seed)();
    expect(a).toBe(b);
  });
});

describe("randInt", () => {
  it("genera interi in [min, max] inclusi", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 200; i++) {
      const v = randInt(rng, 5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("pickOne", () => {
  it("seleziona sempre un elemento dell'array", () => {
    const rng = mulberry32(99);
    const arr = ["a", "b", "c"];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(pickOne(rng, arr));
    }
  });
});

describe("shuffle", () => {
  it("mantiene gli stessi elementi", () => {
    const rng = mulberry32(11);
    const a = [1, 2, 3, 4, 5];
    const b = shuffle(rng, a);
    expect(b.sort()).toEqual([...a].sort());
  });

  it("non muta l'input", () => {
    const rng = mulberry32(11);
    const a = [1, 2, 3];
    shuffle(rng, a);
    expect(a).toEqual([1, 2, 3]);
  });
});
