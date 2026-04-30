import { describe, expect, it } from "vitest";
import {
  computeICL,
  seFromAlpha,
  zFromSample,
} from "@/lib/scoring/composite";
import type { FactorScores, SampleMeans } from "@/types/scoring";

const flatStats: SampleMeans = {
  Gf: { mean: 50, sd: 10 },
  Gwm: { mean: 50, sd: 10 },
  Gs: { mean: 50, sd: 10 },
  Gv: { mean: 50, sd: 10 },
  Gc: { mean: 50, sd: 10 },
};

const meanRaw: FactorScores = {
  Gf: 50,
  Gwm: 50,
  Gs: 50,
  Gv: 50,
  Gc: 50,
};

describe("zFromSample", () => {
  it("restituisce 0 quando raw == mean", () => {
    expect(zFromSample(50, 50, 10)).toBe(0);
  });
  it("restituisce 1 a una SD sopra la media", () => {
    expect(zFromSample(60, 50, 10)).toBe(1);
  });
  it("restituisce -2 a due SD sotto", () => {
    expect(zFromSample(30, 50, 10)).toBe(-2);
  });
  it("tollera SD = 0 restituendo 0", () => {
    expect(zFromSample(60, 50, 0)).toBe(0);
  });
});

describe("computeICL v1", () => {
  it("profilo medio produce ICL = 100", () => {
    const result = computeICL({
      rawFactorScores: meanRaw,
      sampleStats: flatStats,
    });
    expect(result.icl).toBe(100);
    expect(result.lowerCI).toBe(94);
    expect(result.upperCI).toBe(106);
    expect(result.truncated).toBe(false);
    expect(result.formulaVersion).toBe("v1");
  });

  it("profilo a +1 SD su tutti i fattori produce ICL = 120", () => {
    const result = computeICL({
      rawFactorScores: {
        Gf: 60,
        Gwm: 60,
        Gs: 60,
        Gv: 60,
        Gc: 60,
      },
      sampleStats: flatStats,
    });
    expect(result.icl).toBe(120);
  });

  it("profilo a -2 SD produce ICL = 60", () => {
    const result = computeICL({
      rawFactorScores: {
        Gf: 30,
        Gwm: 30,
        Gs: 30,
        Gv: 30,
        Gc: 30,
      },
      sampleStats: flatStats,
    });
    expect(result.icl).toBe(60);
  });

  it("profilo asimmetrico (alto Gf, basso Gs) produce media pesata", () => {
    const result = computeICL({
      rawFactorScores: {
        Gf: 70, // +2 SD -> z = 2
        Gwm: 50,
        Gs: 30, // -2 SD -> z = -2
        Gv: 50,
        Gc: 50,
      },
      sampleStats: flatStats,
    });
    // media pesata z = (2 - 2) / 5 = 0 -> ICL = 100
    expect(result.icl).toBe(100);
  });

  it("tronca a 40 quando il valore grezzo scende sotto", () => {
    const result = computeICL({
      rawFactorScores: {
        Gf: 0,
        Gwm: 0,
        Gs: 0,
        Gv: 0,
        Gc: 0,
      },
      sampleStats: flatStats,
    });
    expect(result.icl).toBe(40);
    expect(result.truncated).toBe(true);
    expect(result.lowerCI).toBe(40);
  });

  it("tronca a 160 quando il valore grezzo sale oltre", () => {
    const result = computeICL({
      rawFactorScores: {
        Gf: 200,
        Gwm: 200,
        Gs: 200,
        Gv: 200,
        Gc: 200,
      },
      sampleStats: flatStats,
    });
    expect(result.icl).toBe(160);
    expect(result.truncated).toBe(true);
    expect(result.upperCI).toBe(160);
  });

  it("rifiuta pesi che non sommano a 1", () => {
    expect(() =>
      computeICL({
        rawFactorScores: meanRaw,
        sampleStats: flatStats,
        weights: { Gf: 0.5, Gwm: 0.5, Gs: 0.5, Gv: 0.5, Gc: 0.5 },
      }),
    ).toThrow(/pesi non sommano a 1/);
  });

  it("rifiuta pesi negativi", () => {
    expect(() =>
      computeICL({
        rawFactorScores: meanRaw,
        sampleStats: flatStats,
        weights: { Gf: -0.2, Gwm: 0.3, Gs: 0.3, Gv: 0.3, Gc: 0.3 },
      }),
    ).toThrow(/peso negativo/);
  });

  it("rifiuta SE negativo", () => {
    expect(() =>
      computeICL({
        rawFactorScores: meanRaw,
        sampleStats: flatStats,
        empiricalSE: -1,
      }),
    ).toThrow(/SE non puo essere negativo/);
  });

  it("usa SE empirico quando fornito", () => {
    const result = computeICL({
      rawFactorScores: meanRaw,
      sampleStats: flatStats,
      empiricalSE: 8,
    });
    expect(result.se).toBe(8);
    expect(result.lowerCI).toBe(92);
    expect(result.upperCI).toBe(108);
  });
});

describe("seFromAlpha", () => {
  it("alpha = 1 -> SE = 0 (misura perfetta)", () => {
    expect(seFromAlpha(1)).toBe(0);
  });
  it("alpha = 0.85 -> SE ~ 7.75", () => {
    expect(seFromAlpha(0.85)).toBeCloseTo(7.746, 2);
  });
  it("alpha = 0 -> SE = 20 (intera SD scala)", () => {
    expect(seFromAlpha(0)).toBe(20);
  });
  it("rifiuta alpha fuori range", () => {
    expect(() => seFromAlpha(1.1)).toThrow();
    expect(() => seFromAlpha(-0.1)).toThrow();
  });
});
