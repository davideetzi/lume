"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TaskShell } from "@/components/tasks/shared/task-shell";
import {
  generatePaperFolding,
  PAPER_GRID,
  type Fold,
  type Hole,
} from "@/lib/items/paper-folding";
import { trialSeed } from "@/lib/items/seed";
import {
  completeTaskAction,
  recordTrialAction,
  startTaskAction,
} from "@/server/actions/trials";
import type { TaskDef } from "@/lib/tasks/catalog";

export function PaperFoldingTask({
  sessionId,
  taskDef,
  totalTrials = 12,
}: {
  sessionId: string;
  taskDef: TaskDef;
  totalTrials?: number;
}) {
  return (
    <TaskShell
      taskDef={taskDef}
      block={({ onBlockDone }) => (
        <Block
          sessionId={sessionId}
          taskCode={taskDef.code}
          totalTrials={totalTrials}
          onDone={onBlockDone}
        />
      )}
    />
  );
}

function Block({
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
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const correctRef = useRef(0);
  const presentedAtRef = useRef(new Date());
  const startedRef = useRef(false);

  const item = useMemo(
    () => generatePaperFolding(trialSeed(sessionId, taskCode, idx)),
    [sessionId, taskCode, idx],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startTaskAction(sessionId, taskCode);
  }, [sessionId, taskCode]);

  useEffect(() => {
    presentedAtRef.current = new Date();
  }, [idx]);

  async function answer(optionIdx: number) {
    if (submitting) return;
    setSubmitting(true);
    const respondedAt = new Date();
    const correct = optionIdx === item.correctIndex;
    if (correct) correctRef.current += 1;
    await recordTrialAction({
      sessionId,
      taskCode,
      itemSeed: item.seed,
      itemMeta: { trial: idx, folds: item.folds, holes: item.holesAfterFolding },
      response: { chosenIndex: optionIdx },
      rtMs: respondedAt.getTime() - presentedAtRef.current.getTime(),
      correct,
      presentedAt: presentedAtRef.current.toISOString(),
      respondedAt: respondedAt.toISOString(),
    });
    if (idx + 1 >= totalTrials) {
      await completeTaskAction({
        sessionId,
        taskCode,
        rawScore: correctRef.current,
        details: { totalTrials, correctCount: correctRef.current },
      });
      onDone();
    } else {
      setIdx((i) => i + 1);
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="text-sm text-foreground-muted">
        Trial {idx + 1} di {totalTrials}
      </div>
      <div className="mt-6 rounded-lg border border-border bg-surface-soft p-4">
        <p className="text-sm text-foreground-muted">
          Stato del foglio piegato (con i fori indicati):
        </p>
        <div className="mt-3 flex justify-center">
          <FoldedPaper folds={item.folds} holes={item.holesAfterFolding} />
        </div>
        <p className="mt-4 text-sm text-foreground-muted">
          Pieghe: {item.folds.map(describeFold).join(", ")}
        </p>
      </div>

      <p className="mt-6 text-sm text-foreground-muted">
        Quale di queste rappresenta il foglio una volta aperto?
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {item.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={submitting}
            onClick={() => void answer(i)}
            aria-label={`Opzione ${i + 1}`}
            className="rounded-lg border border-border bg-surface p-3 transition hover:border-teal disabled:opacity-60"
          >
            <UnfoldedPaper holes={opt} />
          </button>
        ))}
      </div>
    </div>
  );
}

function describeFold(f: Fold): string {
  if (f.axis === "h") return `piega orizzontale dal ${f.from === "top" ? "basso" : "alto"}`;
  return `piega verticale da ${f.from === "left" ? "destra" : "sinistra"}`;
}

const PX = 18;

function FoldedPaper({ folds, holes }: { folds: Fold[]; holes: Hole[] }) {
  // Mostra una zona ridotta del foglio (mezzo o quarto) con i fori.
  const reducedW =
    folds.filter((f) => f.axis === "v").length > 0
      ? PAPER_GRID / 2
      : PAPER_GRID;
  const reducedH =
    folds.filter((f) => f.axis === "h").length > 0
      ? PAPER_GRID / 2
      : PAPER_GRID;
  return (
    <PaperGrid
      width={reducedW}
      height={reducedH}
      holes={holes}
      filled
    />
  );
}

function UnfoldedPaper({ holes }: { holes: Hole[] }) {
  return (
    <PaperGrid
      width={PAPER_GRID}
      height={PAPER_GRID}
      holes={holes}
      filled={false}
    />
  );
}

function PaperGrid({
  width,
  height,
  holes,
  filled,
}: {
  width: number;
  height: number;
  holes: Hole[];
  filled: boolean;
}) {
  return (
    <svg
      width={width * PX + 4}
      height={height * PX + 4}
      viewBox={`0 0 ${width * PX + 4} ${height * PX + 4}`}
    >
      <rect
        x={2}
        y={2}
        width={width * PX}
        height={height * PX}
        fill={filled ? "rgb(255,255,255)" : "rgb(246,247,249)"}
        stroke="rgb(35,52,96)"
        strokeWidth={1.5}
      />
      {/* griglia */}
      {Array.from({ length: width - 1 }).map((_, i) => (
        <line
          key={`v-${i}`}
          x1={2 + (i + 1) * PX}
          y1={2}
          x2={2 + (i + 1) * PX}
          y2={2 + height * PX}
          stroke="rgb(231,233,237)"
        />
      ))}
      {Array.from({ length: height - 1 }).map((_, i) => (
        <line
          key={`h-${i}`}
          x1={2}
          y1={2 + (i + 1) * PX}
          x2={2 + width * PX}
          y2={2 + (i + 1) * PX}
          stroke="rgb(231,233,237)"
        />
      ))}
      {holes.map((h, i) => (
        <circle
          key={i}
          cx={2 + (h.x + 0.5) * PX}
          cy={2 + (h.y + 0.5) * PX}
          r={PX / 3}
          fill="rgb(59,184,185)"
        />
      ))}
    </svg>
  );
}
