"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TaskShell } from "@/components/tasks/shared/task-shell";
import {
  generateMentalRotationItem,
  project,
  type Voxel,
} from "@/lib/items/mental-rotation";
import { trialSeed } from "@/lib/items/seed";
import {
  completeTaskAction,
  recordTrialAction,
  startTaskAction,
} from "@/server/actions/trials";
import type { TaskDef } from "@/lib/tasks/catalog";

export function MentalRotationTask({
  sessionId,
  taskDef,
  totalTrials = 20,
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
  const startedRef = useRef(false);
  const correctRef = useRef(0);
  const presentedAtRef = useRef(new Date());

  const item = useMemo(
    () => generateMentalRotationItem(trialSeed(sessionId, taskCode, idx)),
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

  async function answer(saysSame: boolean) {
    if (submitting) return;
    setSubmitting(true);
    const respondedAt = new Date();
    const correct = saysSame === item.same;
    if (correct) correctRef.current += 1;
    await recordTrialAction({
      sessionId,
      taskCode,
      itemSeed: item.seed,
      itemMeta: { trial: idx, axis: item.rotation.axis, degrees: item.rotation.degrees, same: item.same },
      response: { saysSame },
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
      <div className="mt-6 flex items-center justify-center gap-6 rounded-lg border border-border bg-surface-soft p-6">
        <Iso3D voxels={item.base} label="Figura A" />
        <span className="text-2xl text-foreground-muted">vs</span>
        <Iso3D voxels={item.rotated} label="Figura B" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void answer(true)}
          className="rounded-md bg-navy py-4 text-base font-medium text-white hover:bg-navy-soft disabled:opacity-60"
        >
          Stesso oggetto ruotato
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void answer(false)}
          className="rounded-md border border-border bg-surface py-4 text-base font-medium text-navy hover:border-teal disabled:opacity-60"
        >
          Diversi (specchio)
        </button>
      </div>
    </div>
  );
}

const SCALE = 18;
const VIEWBOX = 220;

function Iso3D({ voxels, label }: { voxels: Voxel[]; label: string }) {
  // proietta e ordina per painter algorithm
  const projected = voxels
    .map((v) => ({ v, p: project(v, SCALE) }))
    .sort((a, b) => a.p.z - b.p.z);

  // bounding box per centrare
  const xs = projected.map((p) => p.p.x);
  const ys = projected.map((p) => p.p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = VIEWBOX / 2 - (minX + maxX) / 2;
  const cy = VIEWBOX / 2 - (minY + maxY) / 2;

  return (
    <svg
      width={VIEWBOX}
      height={VIEWBOX}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      role="img"
      aria-label={label}
    >
      {projected.map(({ p }, i) => (
        <Cube key={i} x={p.x + cx} y={p.y + cy} size={SCALE} />
      ))}
    </svg>
  );
}

function Cube({ x, y, size }: { x: number; y: number; size: number }) {
  const cosY = size * Math.cos(Math.PI / 6);
  const sinY = size * Math.sin(Math.PI / 6);
  const top = `${x},${y - size} ${x + cosY},${y - size + sinY} ${x},${y - size + 2 * sinY} ${x - cosY},${y - size + sinY}`;
  const right = `${x},${y - size + 2 * sinY} ${x + cosY},${y - size + sinY} ${x + cosY},${y + sinY} ${x},${y + 2 * sinY}`;
  const left = `${x - cosY},${y - size + sinY} ${x},${y - size + 2 * sinY} ${x},${y + 2 * sinY} ${x - cosY},${y + sinY}`;

  return (
    <g>
      <polygon points={top} fill="#3bb8b9" stroke="#233460" strokeWidth={1} />
      <polygon points={right} fill="#2fa1a2" stroke="#233460" strokeWidth={1} />
      <polygon points={left} fill="#1f7e7f" stroke="#233460" strokeWidth={1} />
    </g>
  );
}
