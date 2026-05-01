"use client";

import { useEffect, useRef, useState } from "react";
import { TaskShell } from "@/components/tasks/shared/task-shell";
import { CORSI_BLOCKS, generateCorsiSequence } from "@/lib/items/corsi";
import {
  applyAttempt,
  initialState,
} from "@/lib/items/digit-span"; // riusiamo la state machine
import { trialSeed } from "@/lib/items/seed";
import {
  completeTaskAction,
  recordTrialAction,
  startTaskAction,
} from "@/server/actions/trials";
import type { TaskDef } from "@/lib/tasks/catalog";

type Phase = "ready" | "showing" | "input" | "feedback";

export function CorsiTask({
  sessionId,
  taskDef,
}: {
  sessionId: string;
  taskDef: TaskDef;
}) {
  return (
    <TaskShell
      taskDef={taskDef}
      block={({ onBlockDone }) => (
        <Block
          sessionId={sessionId}
          taskCode={taskDef.code}
          onDone={onBlockDone}
        />
      )}
    />
  );
}

const SHOW_INTERVAL_MS = 800;

function Block({
  sessionId,
  taskCode,
  onDone,
}: {
  sessionId: string;
  taskCode: TaskDef["code"];
  onDone: () => void;
}) {
  const [state, setState] = useState(() => initialState(3));
  const [phase, setPhase] = useState<Phase>("ready");
  const [trialIndex, setTrialIndex] = useState(0);
  const [shownIndex, setShownIndex] = useState(-1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userClicks, setUserClicks] = useState<number[]>([]);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const presentedAtRef = useRef(new Date());
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startTaskAction(sessionId, taskCode);
  }, [sessionId, taskCode]);

  function startTrial() {
    const seed = trialSeed(sessionId, taskCode, trialIndex);
    const seq = generateCorsiSequence(seed, state.level);
    setSequence(seq);
    setUserClicks([]);
    setLastCorrect(null);
    setShownIndex(-1);
    setPhase("showing");
    presentedAtRef.current = new Date();
  }

  useEffect(() => {
    if (phase !== "showing" || sequence.length === 0) return;
    if (shownIndex < sequence.length - 1) {
      const t = setTimeout(
        () => setShownIndex((i) => i + 1),
        SHOW_INTERVAL_MS,
      );
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setShownIndex(-1);
      setPhase("input");
    }, SHOW_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [phase, shownIndex, sequence.length]);

  // Auto-start primo trial
  useEffect(() => {
    if (phase === "ready" && trialIndex === 0) {
      const t = setTimeout(startTrial, 500);
      return () => clearTimeout(t);
    }
  }, [phase, trialIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onBlockClick(blockId: number) {
    if (phase !== "input") return;
    const next = [...userClicks, blockId];
    setUserClicks(next);
    if (next.length === sequence.length) {
      const correct =
        next.length === sequence.length &&
        next.every((b, i) => b === sequence[i]);
      setLastCorrect(correct);
      setPhase("feedback");

      const respondedAt = new Date();
      await recordTrialAction({
        sessionId,
        taskCode,
        itemSeed: trialSeed(sessionId, taskCode, trialIndex),
        itemMeta: { level: state.level, sequence },
        response: { clicks: next },
        rtMs: respondedAt.getTime() - presentedAtRef.current.getTime(),
        correct,
        presentedAt: presentedAtRef.current.toISOString(),
        respondedAt: respondedAt.toISOString(),
      });

      const ns = applyAttempt(state, correct);
      setState(ns);
      if (ns.done) {
        const rawScore =
          ns.maxLevelReached +
          (ns.totalAttempts > 0
            ? ns.totalCorrect / ns.totalAttempts / 4
            : 0);
        await completeTaskAction({
          sessionId,
          taskCode,
          rawScore,
          details: {
            maxLevelReached: ns.maxLevelReached,
            totalCorrect: ns.totalCorrect,
            totalAttempts: ns.totalAttempts,
          },
        });
        setTimeout(onDone, 1500);
      }
    }
  }

  function continueAfter() {
    setTrialIndex((i) => i + 1);
    setPhase("ready");
    setTimeout(startTrial, 400);
  }

  return (
    <div className="mt-6">
      <div className="text-sm text-foreground-muted">
        Livello {state.level} · Span massimo {state.maxLevelReached}
      </div>
      <div className="mt-6 rounded-lg border border-border bg-surface-soft p-4">
        <Board
          shownIndex={shownIndex}
          sequence={sequence}
          phase={phase}
          userClicks={userClicks}
          onBlockClick={onBlockClick}
        />
      </div>
      <div className="mt-4 min-h-[40px] text-center text-sm text-foreground-muted">
        {phase === "ready" && "Preparati..."}
        {phase === "showing" && "Osserva la sequenza"}
        {phase === "input" &&
          `Clicca i blocchi nello stesso ordine (${userClicks.length} di ${sequence.length})`}
        {phase === "feedback" && (
          <div>
            <p
              className={
                lastCorrect
                  ? "font-semibold text-teal-strong"
                  : "font-semibold"
              }
            >
              {lastCorrect ? "Corretto" : "Non corretto"}
            </p>
            {!state.done && (
              <button
                type="button"
                onClick={continueAfter}
                className="mt-3 rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft"
              >
                Prossima sequenza
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Board({
  shownIndex,
  sequence,
  phase,
  userClicks,
  onBlockClick,
}: {
  shownIndex: number;
  sequence: number[];
  phase: Phase;
  userClicks: number[];
  onBlockClick: (id: number) => void;
}) {
  const SIZE = 320;
  const BLOCK = 56;
  const litId =
    phase === "showing" && shownIndex >= 0 && shownIndex < sequence.length
      ? sequence[shownIndex]
      : null;
  return (
    <div
      className="relative mx-auto"
      style={{ width: SIZE, height: SIZE }}
      role="group"
      aria-label="Tabella blocchi Corsi"
    >
      {CORSI_BLOCKS.map((b) => {
        const lit = litId === b.id;
        const clickedIdx = userClicks.indexOf(b.id);
        const isClicked = clickedIdx >= 0;
        return (
          <button
            key={b.id}
            type="button"
            disabled={phase !== "input"}
            onClick={() => onBlockClick(b.id)}
            aria-label={`Blocco ${b.id + 1}`}
            className={`absolute rounded-md border transition ${
              lit
                ? "border-teal bg-teal"
                : isClicked
                  ? "border-navy bg-navy/20"
                  : "border-border bg-surface"
            }`}
            style={{
              width: BLOCK,
              height: BLOCK,
              left: b.x * (SIZE - BLOCK),
              top: b.y * (SIZE - BLOCK),
            }}
          >
            {isClicked && (
              <span className="text-xs font-medium text-navy">
                {clickedIdx + 1}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
