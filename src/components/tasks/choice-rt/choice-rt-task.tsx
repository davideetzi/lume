"use client";

import { useEffect, useRef, useState } from "react";
import { TaskShell } from "@/components/tasks/shared/task-shell";
import { mulberry32 } from "@/lib/items/seed";
import {
  completeTaskAction,
  recordTrialAction,
  startTaskAction,
} from "@/server/actions/trials";
import type { TaskDef } from "@/lib/tasks/catalog";

const POSITIONS = [0, 1, 2, 3] as const;
const KEYS = ["d", "f", "j", "k"] as const;
type Position = (typeof POSITIONS)[number];

export function ChoiceRtTask({
  sessionId,
  taskDef,
  totalTrials = 40,
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
  const [target, setTarget] = useState<Position | null>(null);
  const [done, setDone] = useState(false);
  const presentedAtRef = useRef(new Date());
  const startedRef = useRef(false);
  const rtsRef = useRef<number[]>([]);
  const correctRef = useRef(0);
  const rngRef = useRef(mulberry32(hashSeed(sessionId, taskCode)));

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startTaskAction(sessionId, taskCode);
    nextTrial();
  }, [sessionId, taskCode]); // eslint-disable-line react-hooks/exhaustive-deps

  function nextTrial() {
    const t = setTimeout(() => {
      setTarget(POSITIONS[Math.floor(rngRef.current() * 4)] ?? 0);
      presentedAtRef.current = new Date();
    }, 600 + Math.random() * 600);
    return () => clearTimeout(t);
  }

  async function answer(pos: Position) {
    if (target === null || done) return;
    const respondedAt = new Date();
    const rt = respondedAt.getTime() - presentedAtRef.current.getTime();
    const correct = pos === target;
    if (correct) {
      rtsRef.current.push(rt);
      correctRef.current += 1;
    }
    await recordTrialAction({
      sessionId,
      taskCode,
      itemSeed: `${sessionId}::${taskCode}::${idx}`,
      itemMeta: { trial: idx, target },
      response: { chosen: pos },
      rtMs: rt,
      correct,
      presentedAt: presentedAtRef.current.toISOString(),
      respondedAt: respondedAt.toISOString(),
    });
    setTarget(null);
    if (idx + 1 >= totalTrials) {
      await finalize();
    } else {
      setIdx((i) => i + 1);
      nextTrial();
    }
  }

  async function finalize() {
    setDone(true);
    const rts = rtsRef.current.slice().sort((a, b) => a - b);
    const median = rts.length ? rts[Math.floor(rts.length / 2)]! : 9999;
    const sd = stddev(rts);
    // Score grezzo: 1000 / median (piu alto = piu veloce). Penalita su SD alta.
    const raw = rts.length > 0 ? 1000 / median - sd / 1000 : 0;
    await completeTaskAction({
      sessionId,
      taskCode,
      rawScore: raw,
      details: {
        medianRt: median,
        sdRt: sd,
        correctCount: correctRef.current,
        totalTrials,
      },
    });
    setTimeout(onDone, 800);
  }

  // keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const i = KEYS.indexOf(e.key.toLowerCase() as (typeof KEYS)[number]);
      if (i >= 0) void answer(POSITIONS[i]!);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-6">
      <p className="text-sm text-foreground-muted">
        Trial {idx + 1} di {totalTrials}
        {" · "}
        Premi <kbd className="font-mono">D F J K</kbd> oppure tocca
      </p>
      <div className="mt-6 grid grid-cols-4 gap-3">
        {POSITIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => void answer(p)}
            disabled={done}
            className={`flex h-32 items-center justify-center rounded-lg border transition ${
              target === p
                ? "border-teal bg-teal/30"
                : "border-border bg-surface-soft"
            }`}
            aria-label={`Posizione ${p + 1}`}
          >
            {target === p && (
              <span className="text-3xl text-navy" aria-hidden>
                ●
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-3 text-center text-xs text-foreground-muted">
        {KEYS.map((k) => (
          <span key={k} className="uppercase">
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

function hashSeed(a: string, b: string): number {
  let h = 2166136261;
  for (const c of `${a}::${b}`) {
    h = (h ^ c.charCodeAt(0)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length;
  return Math.sqrt(v);
}
