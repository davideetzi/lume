"use client";

import { useEffect, useRef, useState } from "react";
import { TaskShell } from "@/components/tasks/shared/task-shell";
import { dPrime, generateNbackSequence } from "@/lib/items/nback";
import { trialSeed } from "@/lib/items/seed";
import {
  completeTaskAction,
  recordTrialAction,
  startTaskAction,
} from "@/server/actions/trials";
import type { TaskDef } from "@/lib/tasks/catalog";

const STIM_MS = 500;
const ISI_MS = 1500;

export function NbackTask({
  sessionId,
  taskDef,
  totalTrials = 30,
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
  const [seq] = useState(() => {
    return generateNbackSequence(
      trialSeed(sessionId, taskCode, 0),
      totalTrials,
    );
  });
  const [idx, setIdx] = useState<number>(-1);
  const [showStim, setShowStim] = useState(false);
  const responsesRef = useRef<boolean[]>([]); // true = pressed during stim
  const presentedAtRef = useRef<Date | null>(null);
  const startedRef = useRef(false);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startTaskAction(sessionId, taskCode);
  }, [sessionId, taskCode]);

  // countdown 3-2-1, poi inizio
  useEffect(() => {
    if (idx >= 0 || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [countdown, idx]);

  useEffect(() => {
    if (countdown === 0 && idx === -1) {
      setIdx(0);
    }
  }, [countdown, idx]);

  // Loop principale: per ogni stimolo mostralo per STIM_MS, poi ISI_MS,
  // poi avanza. Registra il response al termine di ogni stimolo.
  useEffect(() => {
    if (idx < 0 || idx >= seq.sequence.length) return;
    setShowStim(true);
    presentedAtRef.current = new Date();
    if (responsesRef.current.length <= idx) {
      responsesRef.current.push(false);
    }
    const t1 = setTimeout(() => setShowStim(false), STIM_MS);
    const t2 = setTimeout(async () => {
      // logging trial
      const resp = responsesRef.current[idx]!;
      const isTarget = seq.targets[idx]!;
      const correct = resp === isTarget;
      await recordTrialAction({
        sessionId,
        taskCode,
        itemSeed: trialSeed(sessionId, taskCode, 0),
        itemMeta: { stimIndex: idx, letter: seq.sequence[idx], target: isTarget },
        response: { pressed: resp },
        rtMs: STIM_MS, // approssimato, n-back non usa RT preciso
        correct,
        presentedAt: presentedAtRef.current!.toISOString(),
        respondedAt: new Date().toISOString(),
      });
      if (idx + 1 >= seq.sequence.length) {
        await finalize();
      } else {
        setIdx((i) => i + 1);
      }
    }, STIM_MS + ISI_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [idx, seq, sessionId, taskCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tasto spazio = press
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" && idx >= 0 && showStim) {
        e.preventDefault();
        responsesRef.current[idx] = true;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, showStim]);

  async function finalize() {
    let hits = 0,
      misses = 0,
      fa = 0,
      cr = 0;
    for (let i = 0; i < seq.sequence.length; i++) {
      const t = seq.targets[i];
      const r = responsesRef.current[i];
      if (t && r) hits++;
      else if (t && !r) misses++;
      else if (!t && r) fa++;
      else cr++;
    }
    const dp = dPrime(hits, misses, fa, cr);
    await completeTaskAction({
      sessionId,
      taskCode,
      rawScore: dp,
      details: { hits, misses, falseAlarms: fa, correctRejections: cr, dPrime: dp },
    });
    setDone(true);
    setTimeout(onDone, 1500);
  }

  return (
    <div className="mt-6">
      <div className="text-sm text-foreground-muted">
        Premi <kbd className="rounded border border-border bg-surface-soft px-2 py-0.5 text-xs">SPAZIO</kbd>{" "}
        quando la lettera attuale e uguale a quella di due passi prima.
        Stimolo {Math.max(0, idx) + 1} di {totalTrials}
      </div>
      <div className="mt-6 flex min-h-[260px] items-center justify-center rounded-lg border border-border bg-surface-soft p-8">
        {countdown > 0 && idx === -1 && (
          <p className="text-5xl font-semibold text-navy">{countdown}</p>
        )}
        {idx >= 0 && (
          <p
            className={`font-mono text-8xl font-semibold transition-opacity ${
              showStim ? "opacity-100 text-navy" : "opacity-0"
            }`}
          >
            {seq.sequence[idx]}
          </p>
        )}
        {done && (
          <p className="text-foreground-muted">
            Blocco completato. Salvataggio...
          </p>
        )}
      </div>
      <button
        type="button"
        onPointerDown={() => {
          if (idx >= 0 && showStim) responsesRef.current[idx] = true;
        }}
        className="mt-4 w-full rounded-md bg-navy px-6 py-4 text-base font-medium text-white hover:bg-navy-soft"
      >
        Tocca o premi spazio per segnalare un match
      </button>
    </div>
  );
}
