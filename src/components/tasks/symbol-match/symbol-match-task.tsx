"use client";

import { useEffect, useRef, useState } from "react";
import { TaskShell } from "@/components/tasks/shared/task-shell";
import { generateSymbolMatch } from "@/lib/items/symbol-match";
import { trialSeed } from "@/lib/items/seed";
import {
  completeTaskAction,
  recordTrialAction,
  startTaskAction,
} from "@/server/actions/trials";
import type { TaskDef } from "@/lib/tasks/catalog";

const TIME_LIMIT_MS = 90_000;

export function SymbolMatchTask({
  sessionId,
  taskDef,
  totalTrials = 60,
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
  const [item, setItem] = useState(() =>
    generateSymbolMatch(trialSeed(sessionId, taskCode, 0)),
  );
  const [done, setDone] = useState(false);
  const presentedAtRef = useRef(new Date());
  const startedRef = useRef(false);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const startedAtRef = useRef<Date>(new Date());
  const [remainingMs, setRemainingMs] = useState(TIME_LIMIT_MS);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startTaskAction(sessionId, taskCode);
    startedAtRef.current = new Date();
  }, [sessionId, taskCode]);

  // timer
  useEffect(() => {
    const t = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current.getTime();
      const r = Math.max(0, TIME_LIMIT_MS - elapsed);
      setRemainingMs(r);
      if (r <= 0) {
        clearInterval(t);
        void finalize();
      }
    }, 100);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    presentedAtRef.current = new Date();
  }, [idx]);

  async function answer(saysSame: boolean) {
    if (done) return;
    const respondedAt = new Date();
    const correct = saysSame === item.same;
    if (correct) correctRef.current += 1;
    else wrongRef.current += 1;
    await recordTrialAction({
      sessionId,
      taskCode,
      itemSeed: item.seed,
      itemMeta: { trial: idx, same: item.same },
      response: { saysSame },
      rtMs: respondedAt.getTime() - presentedAtRef.current.getTime(),
      correct,
      presentedAt: presentedAtRef.current.toISOString(),
      respondedAt: respondedAt.toISOString(),
    });
    if (idx + 1 >= totalTrials) {
      await finalize();
    } else {
      setIdx((i) => i + 1);
      setItem(generateSymbolMatch(trialSeed(sessionId, taskCode, idx + 1)));
    }
  }

  async function finalize() {
    if (done) return;
    setDone(true);
    // Score grezzo: trial corretti meno errori (correzione per guessing)
    const raw = correctRef.current - 0.5 * wrongRef.current;
    await completeTaskAction({
      sessionId,
      taskCode,
      rawScore: raw,
      details: {
        correct: correctRef.current,
        wrong: wrongRef.current,
        trialsCompleted: correctRef.current + wrongRef.current,
        timeUsedMs: Date.now() - startedAtRef.current.getTime(),
      },
    });
    setTimeout(onDone, 800);
  }

  // tasti rapidi: F = uguali, J = diversi
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "f") void answer(true);
      else if (e.key.toLowerCase() === "j") void answer(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, idx, done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (done) {
    return (
      <div className="mt-6 text-foreground-muted">Salvataggio in corso...</div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between text-sm text-foreground-muted">
        <span>
          Risposte: {correctRef.current + wrongRef.current} di {totalTrials}
        </span>
        <span>Tempo restante: {Math.ceil(remainingMs / 1000)} s</span>
      </div>
      <div className="mt-6 flex items-center justify-center gap-8 rounded-lg border border-border bg-surface-soft p-10">
        <SymbolBox d={item.left.d} size={item.left.size} />
        <span className="text-2xl text-foreground-muted">vs</span>
        <SymbolBox d={item.right.d} size={item.right.size} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => void answer(true)}
          className="rounded-md bg-navy py-4 text-base font-medium text-white hover:bg-navy-soft"
        >
          Uguali (F)
        </button>
        <button
          type="button"
          onClick={() => void answer(false)}
          className="rounded-md border border-border bg-surface py-4 text-base font-medium text-navy hover:border-teal"
        >
          Diversi (J)
        </button>
      </div>
    </div>
  );
}

function SymbolBox({ d, size }: { d: string; size: number }) {
  return (
    <svg
      width={size + 16}
      height={size + 16}
      viewBox={`-8 -8 ${size + 16} ${size + 16}`}
      role="img"
      aria-label="Simbolo astratto"
    >
      <rect
        x={-8}
        y={-8}
        width={size + 16}
        height={size + 16}
        fill="white"
        stroke="rgb(231,233,237)"
      />
      <path d={d} stroke="rgb(35,52,96)" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
