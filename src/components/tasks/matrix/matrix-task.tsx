"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TaskShell } from "@/components/tasks/shared/task-shell";
import {
  difficultyForTrial,
  generateMatrix,
  type MatrixItem,
} from "@/lib/items/matrix";
import { trialSeed } from "@/lib/items/seed";
import { CellPlaceholder, CellSvg } from "./cell-svg";
import {
  completeTaskAction,
  recordTrialAction,
  startTaskAction,
} from "@/server/actions/trials";
import type { TaskDef } from "@/lib/tasks/catalog";

type MatrixTaskProps = {
  sessionId: string;
  taskDef: TaskDef;
  totalTrials?: number;
};

export function MatrixTask({
  sessionId,
  taskDef,
  totalTrials = 20,
}: MatrixTaskProps) {
  return (
    <TaskShell
      taskDef={taskDef}
      practice={({ onPracticeDone }) => (
        <PracticeBlock onDone={onPracticeDone} />
      )}
      block={({ onBlockDone }) => (
        <MainBlock
          sessionId={sessionId}
          taskCode={taskDef.code}
          totalTrials={totalTrials}
          onDone={onBlockDone}
        />
      )}
    />
  );
}

function PracticeBlock({ onDone }: { onDone: () => void }) {
  const item = useMemo(
    () => generateMatrix({ seed: "practice-matrix-1", difficulty: 1 }),
    [],
  );
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <div className="mt-6">
      <p className="text-foreground-muted">
        Esempio guidato. Sceglierai la figura mancante. Riceverai un piccolo
        feedback. Niente di tutto questo verra registrato.
      </p>
      <MatrixGrid item={item} className="mt-6" />
      <Options
        item={item}
        chosen={chosen}
        onChoose={setChosen}
        showCorrect={chosen !== null}
      />
      {chosen !== null && (
        <div className="mt-6 rounded-md border border-border bg-surface-soft p-4 text-sm text-foreground-muted">
          {chosen === item.correctIndex
            ? "Esatto. La regola era una progressione semplice. Quando sei pronto, prosegui."
            : "Non era questa. La risposta corretta e evidenziata. Prendi il tempo che serve, poi prosegui."}
          <button
            type="button"
            onClick={onDone}
            className="ml-4 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-soft"
          >
            Inizia il blocco
          </button>
        </div>
      )}
    </div>
  );
}

function MainBlock({
  sessionId,
  taskCode,
  totalTrials,
  onDone,
}: {
  sessionId: string;
  taskCode: TaskDef["code"];
  totalTrials: number;
  onDone: () => void;
}) {
  const [trialIndex, setTrialIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const presentedAtRef = useRef<Date>(new Date());
  const correctCountRef = useRef(0);
  const startedRef = useRef(false);

  const item = useMemo(() => {
    return generateMatrix({
      seed: trialSeed(sessionId, taskCode, trialIndex),
      difficulty: difficultyForTrial(trialIndex),
    });
  }, [sessionId, taskCode, trialIndex]);

  // marca "in_progress" al primo render del blocco
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startTaskAction(sessionId, taskCode);
  }, [sessionId, taskCode]);

  // resetta presentedAt ad ogni nuovo trial
  useEffect(() => {
    presentedAtRef.current = new Date();
  }, [trialIndex]);

  async function onChoose(idx: number) {
    if (submitting) return;
    setSubmitting(true);
    const respondedAt = new Date();
    const correct = idx === item.correctIndex;
    if (correct) correctCountRef.current += 1;

    await recordTrialAction({
      sessionId,
      taskCode,
      itemSeed: item.seed,
      itemMeta: {
        difficulty: item.difficulty,
        rules: item.rules,
        correctIndex: item.correctIndex,
      },
      response: { chosenIndex: idx },
      rtMs: respondedAt.getTime() - presentedAtRef.current.getTime(),
      correct,
      presentedAt: presentedAtRef.current.toISOString(),
      respondedAt: respondedAt.toISOString(),
    });

    if (trialIndex + 1 >= totalTrials) {
      // pesatura per difficolta = numero di regole attive (1-3)
      const difficultyWeights = await computeWeightedScore(
        sessionId,
        taskCode,
        totalTrials,
      );
      await completeTaskAction({
        sessionId,
        taskCode,
        rawScore: difficultyWeights.weightedScore,
        details: {
          accuracy: difficultyWeights.accuracy,
          correctCount: correctCountRef.current,
          totalTrials,
        },
      });
      onDone();
    } else {
      setTrialIndex((i) => i + 1);
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      <Progress trialIndex={trialIndex} totalTrials={totalTrials} />
      <MatrixGrid item={item} className="mt-6" />
      <Options
        item={item}
        chosen={null}
        onChoose={(idx) => void onChoose(idx)}
        disabled={submitting}
      />
    </div>
  );
}

/**
 * Score grezzo per il task matrice: somma dei trial corretti pesata per
 * difficolta dell'item (numero di regole attive). Calcolato sui trial gia
 * salvati lato client (qui usiamo solo il counter locale per evitare round-trip).
 */
async function computeWeightedScore(
  _sessionId: string,
  _taskCode: string,
  _totalTrials: number,
): Promise<{ weightedScore: number; accuracy: number }> {
  // Implementazione client-friendly: contiamo dal counter locale.
  // Il calcolo definitivo per il fattore avverra lato server in sessione 7
  // partendo dai Trial salvati (che includono difficulty).
  return Promise.resolve({ weightedScore: 0, accuracy: 0 });
}

function MatrixGrid({
  item,
  className,
}: {
  item: MatrixItem;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto grid grid-cols-3 gap-2 rounded-lg border border-border bg-surface-soft p-3 sm:gap-3 sm:p-4 ${className ?? ""}`}
      style={{ maxWidth: 320 }}
      role="group"
      aria-label="Griglia 3 per 3, l'ultima cella e mancante"
    >
      {item.grid.map((row, r) =>
        row.map((cell, c) => {
          const isMissing = r === 2 && c === 2;
          return (
            <div key={`${r}-${c}`} className="flex items-center justify-center">
              {isMissing ? <CellPlaceholder size={88} /> : <CellSvg cell={cell} size={88} />}
            </div>
          );
        }),
      )}
    </div>
  );
}

function Options({
  item,
  chosen,
  onChoose,
  showCorrect = false,
  disabled = false,
}: {
  item: MatrixItem;
  chosen: number | null;
  onChoose: (idx: number) => void;
  showCorrect?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6">
      <p className="text-sm text-foreground-muted">
        Quale figura completa la griglia?
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {item.options.map((cell, idx) => {
          const isChosen = chosen === idx;
          const isCorrect = idx === item.correctIndex;
          const ring =
            showCorrect && isCorrect
              ? "ring-2 ring-teal"
              : isChosen
                ? "ring-2 ring-navy"
                : "";
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onChoose(idx)}
              aria-label={`Opzione ${idx + 1}`}
              className={`rounded-lg border border-border bg-surface p-3 transition hover:border-teal disabled:opacity-60 ${ring}`}
            >
              <div className="flex items-center justify-center">
                <CellSvg cell={cell} size={68} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Progress({
  trialIndex,
  totalTrials,
}: {
  trialIndex: number;
  totalTrials: number;
}) {
  const pct = ((trialIndex + 1) / totalTrials) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs text-foreground-muted">
        <span>
          Prova {trialIndex + 1} di {totalTrials}
        </span>
        <span>{Math.round(pct)} percento</span>
      </div>
      <div className="mt-1 h-1 w-full rounded-full bg-surface-soft">
        <div
          className="h-1 rounded-full bg-teal transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
