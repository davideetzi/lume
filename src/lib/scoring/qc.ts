/**
 * Quality control sulla sessione (sezione 5.4.1, 10.3 della specifica).
 * Una sessione che fallisce QC non produce ICL ma riceve comunque profilo
 * a 5 fattori (con disclaimer).
 */

export type QcFlag =
  | "RT_IMPOSSIBLY_FAST"
  | "UNIFORM_RESPONSE_PATTERN"
  | "INSUFFICIENT_TASK_COMPLETION"
  | "ABANDONMENT";

export type QcResult = {
  passed: boolean;
  flags: QcFlag[];
};

export type TrialForQc = {
  taskCode: string;
  rtMs: number | null;
  response: unknown;
  correct: boolean | null;
};

const RT_MIN_MS = 200;
const TASKS_REQUIRED = 11;

export function evaluateQc(
  trials: TrialForQc[],
  completedTasksCount: number,
): QcResult {
  const flags: QcFlag[] = [];

  // RT impossibilmente bassi (controllo solo per task non-Gs perche Gs e
  // intrinsecamente veloce)
  const slowTaskTrials = trials.filter(
    (t) => !["symbol_match", "choice_rt", "nback"].includes(t.taskCode),
  );
  const fastCount = slowTaskTrials.filter(
    (t) => t.rtMs !== null && t.rtMs < RT_MIN_MS,
  ).length;
  if (slowTaskTrials.length > 0 && fastCount / slowTaskTrials.length > 0.3) {
    flags.push("RT_IMPOSSIBLY_FAST");
  }

  // Pattern di risposta uniforme: stesso option index nel 90%+ dei trial
  // di un task con risposte multiple
  const byTask: Record<string, unknown[]> = {};
  for (const t of trials) {
    if (
      t.response &&
      typeof t.response === "object" &&
      "chosenIndex" in (t.response as object)
    ) {
      byTask[t.taskCode] = byTask[t.taskCode] || [];
      byTask[t.taskCode]!.push((t.response as { chosenIndex: unknown }).chosenIndex);
    }
  }
  for (const [, choices] of Object.entries(byTask)) {
    if (choices.length >= 8) {
      const counts: Record<string, number> = {};
      for (const c of choices) counts[String(c)] = (counts[String(c)] || 0) + 1;
      const max = Math.max(...Object.values(counts));
      if (max / choices.length > 0.9) {
        flags.push("UNIFORM_RESPONSE_PATTERN");
        break;
      }
    }
  }

  // Task incompleti
  if (completedTasksCount < TASKS_REQUIRED) {
    flags.push("INSUFFICIENT_TASK_COMPLETION");
    if (completedTasksCount === 0) {
      flags.push("ABANDONMENT");
    }
  }

  return { passed: flags.length === 0, flags };
}
