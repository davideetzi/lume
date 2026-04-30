import {
  FACTOR_CODES,
  type FactorCode,
  type FactorScores,
  type FactorWeights,
  type ICLResult,
  type SampleMeans,
  ICL_DEFAULTS,
} from "@/types/scoring";

export type ComputeICLInput = {
  /** Punteggi grezzi per fattore (raw score interno al task, gia aggregato) */
  rawFactorScores: FactorScores;
  /** Statistiche del campione Lume corrente (media, sd) per fattore */
  sampleStats: SampleMeans;
  /** Pesi per fattore. v1 = 0.20 ciascuno. v2 = factor loadings da CFA. */
  weights?: FactorWeights;
  /** SE empirico se disponibile, altrimenti default v1 = 6. */
  empiricalSE?: number;
  /** Versione formula. v1 (pesi uguali), v2 (pesi da CFA). */
  formulaVersion?: "v1" | "v2";
};

/**
 * Calcolo Z-score di un fattore rispetto alle stats del campione.
 * Tollera SD = 0 (campione iniziale degenerato): restituisce 0.
 */
export function zFromSample(
  raw: number,
  mean: number,
  sd: number,
): number {
  if (!Number.isFinite(raw) || !Number.isFinite(mean) || !Number.isFinite(sd)) {
    throw new Error("zFromSample: input non finiti");
  }
  if (sd <= 0) return 0;
  return (raw - mean) / sd;
}

/**
 * Indice Cognitivo Composito Lume (ICL).
 * Formula v1 (sezione 5.4.1):
 *   ICL = 100 + 20 * media_pesata(z_Gf, z_Gwm, z_Gs, z_Gv, z_Gc)
 * Troncamento a [40, 160].
 *
 * Funzione pura, testabile, non dipende da Prisma.
 */
export function computeICL(input: ComputeICLInput): ICLResult {
  const {
    rawFactorScores,
    sampleStats,
    weights = ICL_DEFAULTS.equalWeights,
    empiricalSE,
    formulaVersion = "v1",
  } = input;

  validateWeights(weights);

  let weightedZ = 0;
  for (const code of FACTOR_CODES) {
    const raw = rawFactorScores[code];
    const stat = sampleStats[code];
    if (raw === undefined || !stat) {
      throw new Error(`computeICL: dati mancanti per fattore ${code}`);
    }
    const z = zFromSample(raw, stat.mean, stat.sd);
    weightedZ += z * weights[code];
  }

  const rawIcl = ICL_DEFAULTS.scaleMean + ICL_DEFAULTS.scaleSD * weightedZ;
  const truncated =
    rawIcl < ICL_DEFAULTS.rangeMin || rawIcl > ICL_DEFAULTS.rangeMax;
  const icl = clamp(rawIcl, ICL_DEFAULTS.rangeMin, ICL_DEFAULTS.rangeMax);

  const se = empiricalSE ?? ICL_DEFAULTS.defaultSE;
  if (se < 0) {
    throw new Error("computeICL: SE non puo essere negativo");
  }

  return {
    icl: roundHalf(icl),
    se: roundHalf(se),
    lowerCI: roundHalf(Math.max(ICL_DEFAULTS.rangeMin, icl - se)),
    upperCI: roundHalf(Math.min(ICL_DEFAULTS.rangeMax, icl + se)),
    truncated,
    formulaVersion,
    weights,
  };
}

function validateWeights(weights: FactorWeights) {
  const sum = FACTOR_CODES.reduce((acc, c) => acc + weights[c], 0);
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(
      `computeICL: pesi non sommano a 1, somma = ${sum.toFixed(6)}`,
    );
  }
  for (const c of FACTOR_CODES) {
    if (weights[c] < 0) {
      throw new Error(`computeICL: peso negativo per ${c}`);
    }
  }
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function roundHalf(x: number): number {
  return Math.round(x * 10) / 10;
}

/**
 * Stima SE empirico dal coefficiente alpha di Cronbach del composito.
 * SEM = SD_scala * sqrt(1 - alpha). Per scala 100 +/- 20, SD = 20.
 */
export function seFromAlpha(alpha: number): number {
  if (alpha < 0 || alpha > 1) {
    throw new Error("seFromAlpha: alpha deve essere in [0,1]");
  }
  return ICL_DEFAULTS.scaleSD * Math.sqrt(1 - alpha);
}

export function _exportsForTest() {
  return { validateWeights, clamp, roundHalf };
}

// Re-export per ergonomia consumer
export { FACTOR_CODES };
export type { FactorCode };
