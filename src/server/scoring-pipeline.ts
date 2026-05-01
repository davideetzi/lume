import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { TASKS, type TaskCode } from "@/lib/tasks/catalog";
import { FACTOR_CODES, type FactorCode } from "@/types/scoring";
import { computeICL } from "@/lib/scoring/composite";
import { evaluateQc } from "@/lib/scoring/qc";

/**
 * Pipeline scoring di una sessione completata.
 *
 * 1. carica i raw score dei TaskInstance completati
 * 2. aggrega per fattore (media degli z-score interni dei task del fattore
 *    rispetto al riferimento corrente)
 * 3. valuta QC sui Trial
 * 4. crea FactorScore (5 righe) e CompositeScore (1 riga, solo se qcPassed)
 *
 * Nota: il SampleStat batch viene aggiornato separatamente. In v1, se non
 * esistono ancora abbastanza sessioni per fare statistiche affidabili,
 * usiamo medie di riferimento "boilerplate" che permettono comunque di
 * mostrare un profilo. Il flag isReferenceSample lo segnala.
 */
export async function runScoringForSession(sessionId: string) {
  const session = await prisma.assessmentSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { taskInstances: true, trials: true },
  });

  if (session.status !== "completed") {
    throw new Error("La sessione deve essere completata prima dello scoring");
  }

  const completedTasks = session.taskInstances.filter(
    (ti) => ti.status === "completed" && ti.rawScore !== null,
  );

  // QC
  const qc = evaluateQc(
    session.trials.map((t) => ({
      taskCode: t.taskCode,
      rtMs: t.rtMs,
      response: t.response as unknown,
      correct: t.correct,
    })),
    completedTasks.length,
  );

  await prisma.assessmentSession.update({
    where: { id: sessionId },
    data: { qcPassed: qc.passed, qcFlags: qc.flags as Prisma.InputJsonValue },
  });

  // Calcolo per fattore: aggrega raw score dei task del fattore, normalizza
  const stats = await loadOrInitSampleStats();
  const referenceMode = stats.isReference;

  const factorRaws: Record<FactorCode, number> = {
    Gf: 0,
    Gwm: 0,
    Gs: 0,
    Gv: 0,
    Gc: 0,
  };
  const factorTaskCount: Record<FactorCode, number> = {
    Gf: 0,
    Gwm: 0,
    Gs: 0,
    Gv: 0,
    Gc: 0,
  };

  for (const ti of completedTasks) {
    const def = TASKS[ti.taskCode as TaskCode];
    if (!def) continue;
    const z = standardize(
      ti.rawScore!,
      stats.taskRefs[ti.taskCode as TaskCode] ?? { mean: 0, sd: 1 },
    );
    factorRaws[def.factor] += z;
    factorTaskCount[def.factor] += 1;
  }

  // Media degli z-score dei task per fattore = z del fattore
  const factorZ: Record<FactorCode, number> = {
    Gf: 0, Gwm: 0, Gs: 0, Gv: 0, Gc: 0,
  };
  for (const f of FACTOR_CODES) {
    factorZ[f] = factorTaskCount[f] > 0 ? factorRaws[f] / factorTaskCount[f] : 0;
  }

  // Persisti FactorScore (delete + create per idempotenza)
  await prisma.factorScore.deleteMany({ where: { sessionId } });
  for (const f of FACTOR_CODES) {
    await prisma.factorScore.create({
      data: {
        sessionId,
        factor: f,
        rawScore: factorRaws[f],
        zScore: factorZ[f],
      },
    });
  }

  // ICL solo se QC passa. Pesi uguali in v1.
  await prisma.compositeScore.deleteMany({ where: { sessionId } });
  if (qc.passed) {
    // Trasformo factorZ in "raw vs media 0 sd 1" per la formula computeICL
    const flatStats = {
      Gf: { mean: 0, sd: 1 },
      Gwm: { mean: 0, sd: 1 },
      Gs: { mean: 0, sd: 1 },
      Gv: { mean: 0, sd: 1 },
      Gc: { mean: 0, sd: 1 },
    };
    const result = computeICL({
      rawFactorScores: factorZ,
      sampleStats: flatStats,
    });
    await prisma.compositeScore.create({
      data: {
        sessionId,
        icl: result.icl,
        se: result.se,
        lowerCI: result.lowerCI,
        upperCI: result.upperCI,
        qcPassed: true,
        formulaVersion: "v1",
        weights: result.weights as unknown as Prisma.InputJsonValue,
      },
    });
  }

  return { qc, factorZ, referenceMode };
}

/**
 * Z-score di un raw rispetto a (mean, sd). Tollerante a sd <= 0.
 */
function standardize(raw: number, ref: { mean: number; sd: number }): number {
  if (!Number.isFinite(raw)) return 0;
  if (ref.sd <= 0) return 0;
  return (raw - ref.mean) / ref.sd;
}

type SampleSnapshot = {
  isReference: boolean; // true = stats di riferimento, no campione reale
  taskRefs: Partial<Record<TaskCode, { mean: number; sd: number }>>;
};

/**
 * Carica le statistiche di riferimento dai task completati nelle sessioni
 * passate. Se ce ne sono meno di 30 (numero arbitrario in v1), usa le
 * statistiche di riferimento "boilerplate" definite a mano.
 *
 * In v3 questa funzione attingera dalle norme italiane stratificate.
 */
async function loadOrInitSampleStats(): Promise<SampleSnapshot> {
  const minSamples = 30;
  // Statistiche per task usando i raw score salvati da TaskInstance
  const all = await prisma.taskInstance.findMany({
    where: {
      status: "completed",
      rawScore: { not: null },
    },
    select: { taskCode: true, rawScore: true },
  });

  const byTask: Partial<Record<TaskCode, number[]>> = {};
  for (const r of all) {
    const tc = r.taskCode as TaskCode;
    byTask[tc] = byTask[tc] || [];
    byTask[tc]!.push(r.rawScore!);
  }

  const taskRefs: Partial<Record<TaskCode, { mean: number; sd: number }>> = {};
  let isReference = true;
  for (const [taskCode, vals] of Object.entries(byTask)) {
    if (!vals || vals.length < minSamples) {
      taskRefs[taskCode as TaskCode] = REFERENCE_STATS[taskCode as TaskCode];
    } else {
      isReference = false;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const v = vals.reduce((s, x) => s + (x - mean) ** 2, 0) / vals.length;
      taskRefs[taskCode as TaskCode] = { mean, sd: Math.sqrt(v) };
    }
  }

  // task senza statistiche affatto (mai completate da nessuno) -> reference
  for (const tc of Object.keys(TASKS) as TaskCode[]) {
    if (!taskRefs[tc]) taskRefs[tc] = REFERENCE_STATS[tc];
  }

  return { isReference, taskRefs };
}

/**
 * Statistiche di riferimento "boilerplate" per ciascun task. Servono solo
 * fino a quando il campione Lume e troppo piccolo per stime affidabili.
 * Sono valori di partenza ragionevoli per la scala dei raw score di ogni
 * task, ricavati dalla logica di scoring.
 *
 * Quando il campione raggiunge 30 sessioni complete, vengono sostituite
 * dalle statistiche empiriche.
 */
const REFERENCE_STATS: Record<TaskCode, { mean: number; sd: number }> = {
  matrix: { mean: 12, sd: 4 }, // su 20 trial, accuracy ~60%
  series: { mean: 7, sd: 3 }, // su 12 trial
  digit_span_back: { mean: 5.0, sd: 1.2 }, // span +/- bonus stabilita
  corsi: { mean: 5.0, sd: 1.2 },
  nback: { mean: 1.5, sd: 1.0 }, // d-prime tipico
  symbol_match: { mean: 30, sd: 10 }, // raw score con correzione guessing
  choice_rt: { mean: 2.0, sd: 0.6 }, // 1000/RT ~ 1.5-2.5 per RT 400-650ms
  mental_rotation: { mean: 12, sd: 4 }, // su 20
  paper_folding: { mean: 6, sd: 2 }, // su 12
  vocabulary: { mean: 18, sd: 5 }, // su 30 (item draft, conservativo)
  verbal_inference: { mean: 14, sd: 4 }, // su 24 (item draft)
};
