"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TaskShell } from "@/components/tasks/shared/task-shell";
import {
  generateSeries,
  seriesDifficultyForTrial,
  type SeriesItem,
} from "@/lib/items/series";
import { trialSeed } from "@/lib/items/seed";
import { CellSvg } from "@/components/tasks/matrix/cell-svg";
import {
  completeTaskAction,
  recordTrialAction,
  startTaskAction,
} from "@/server/actions/trials";
import type { TaskDef } from "@/lib/tasks/catalog";

type Props = { sessionId: string; taskDef: TaskDef; totalTrials?: number };

export function SeriesTask({ sessionId, taskDef, totalTrials = 12 }: Props) {
  return (
    <TaskShell
      taskDef={taskDef}
      practice={({ onPracticeDone }) => (
        <Practice onDone={onPracticeDone} />
      )}
      block={({ onBlockDone }) => (
        <Main
          sessionId={sessionId}
          taskCode={taskDef.code}
          totalTrials={totalTrials}
          onDone={onBlockDone}
        />
      )}
    />
  );
}

function Practice({ onDone }: { onDone: () => void }) {
  const item = useMemo(
    () => generateSeries({ seed: "practice-series", difficulty: 1 }),
    [],
  );
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <div className="mt-6">
      <p className="text-foreground-muted">
        Esempio guidato. Cerca la regola che lega le figure, poi scegli quale
        prosegue la serie.
      </p>
      <SequenceRow item={item} className="mt-6" />
      <Options item={item} chosen={chosen} onChoose={setChosen} showCorrect />
      {chosen !== null && (
        <div className="mt-6 rounded-md border border-border bg-surface-soft p-4 text-sm text-foreground-muted">
          {chosen === item.correctIndex
            ? "Esatto. Ottimo, prosegui."
            : "Non era questa. La risposta corretta e evidenziata."}
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

function Main({
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
  const presentedAtRef = useRef(new Date());
  const correctRef = useRef(0);
  const startedRef = useRef(false);

  const item = useMemo(
    () =>
      generateSeries({
        seed: trialSeed(sessionId, taskCode, trialIndex),
        difficulty: seriesDifficultyForTrial(trialIndex),
      }),
    [sessionId, taskCode, trialIndex],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startTaskAction(sessionId, taskCode);
  }, [sessionId, taskCode]);

  useEffect(() => {
    presentedAtRef.current = new Date();
  }, [trialIndex]);

  async function onChoose(idx: number) {
    if (submitting) return;
    setSubmitting(true);
    const respondedAt = new Date();
    const correct = idx === item.correctIndex;
    if (correct) correctRef.current += 1;
    await recordTrialAction({
      sessionId,
      taskCode,
      itemSeed: item.seed,
      itemMeta: { difficulty: item.difficulty, rules: item.rules },
      response: { chosenIndex: idx },
      rtMs: respondedAt.getTime() - presentedAtRef.current.getTime(),
      correct,
      presentedAt: presentedAtRef.current.toISOString(),
      respondedAt: respondedAt.toISOString(),
    });
    if (trialIndex + 1 >= totalTrials) {
      await completeTaskAction({
        sessionId,
        taskCode,
        rawScore: correctRef.current,
        details: { totalTrials, correctCount: correctRef.current },
      });
      onDone();
    } else {
      setTrialIndex((i) => i + 1);
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      <Progress idx={trialIndex} total={totalTrials} />
      <SequenceRow item={item} className="mt-6" />
      <Options
        item={item}
        chosen={null}
        onChoose={(i) => void onChoose(i)}
        disabled={submitting}
      />
    </div>
  );
}

function SequenceRow({
  item,
  className,
}: {
  item: SeriesItem;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex flex-wrap items-center justify-center gap-2 rounded-lg border border-border bg-surface-soft p-4 ${className ?? ""}`}
      role="group"
      aria-label="Sequenza di figure"
    >
      {item.sequence.map((cell, i) => (
        <CellSvg key={i} cell={cell} size={64} />
      ))}
      <span className="mx-2 text-2xl text-foreground-muted">→</span>
      <div className="flex h-[64px] w-[64px] items-center justify-center rounded border-2 border-dashed border-teal text-2xl text-foreground-muted">
        ?
      </div>
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
  item: SeriesItem;
  chosen: number | null;
  onChoose: (i: number) => void;
  showCorrect?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6">
      <p className="text-sm text-foreground-muted">
        Quale figura prosegue la serie?
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {item.options.map((cell, idx) => {
          const ring =
            showCorrect && idx === item.correctIndex
              ? "ring-2 ring-teal"
              : chosen === idx
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
              <div className="flex justify-center">
                <CellSvg cell={cell} size={56} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Progress({ idx, total }: { idx: number; total: number }) {
  const pct = ((idx + 1) / total) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs text-foreground-muted">
        <span>
          Prova {idx + 1} di {total}
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
