export const FACTOR_CODES = ["Gf", "Gwm", "Gs", "Gv", "Gc"] as const;
export type FactorCode = (typeof FACTOR_CODES)[number];

export type FactorScores = Record<FactorCode, number>;
export type SampleMeans = Record<FactorCode, { mean: number; sd: number }>;
export type FactorWeights = Record<FactorCode, number>;

export type ICLResult = {
  icl: number;
  se: number;
  lowerCI: number;
  upperCI: number;
  truncated: boolean;
  formulaVersion: "v1" | "v2";
  weights: FactorWeights;
};

export const ICL_DEFAULTS = {
  scaleMean: 100,
  scaleSD: 20,
  rangeMin: 40,
  rangeMax: 160,
  /**
   * v1: SE fisso a 6, in attesa di stima empirica da alpha del composito.
   * Vedi sezione 5.4.1: SE = 20 * sqrt(1 - alpha_composite). Target alpha > 0.85.
   */
  defaultSE: 6,
  equalWeights: {
    Gf: 0.2,
    Gwm: 0.2,
    Gs: 0.2,
    Gv: 0.2,
    Gc: 0.2,
  } satisfies FactorWeights,
} as const;
