"use client";

import { useEffect, useRef, useState } from "react";
import { TaskShell } from "@/components/tasks/shared/task-shell";
import {
  applyAttempt,
  generateDigitSequence,
  initialState,
  reverseSequence,
} from "@/lib/items/digit-span";
import { trialSeed } from "@/lib/items/seed";
import {
  completeTaskAction,
  recordTrialAction,
  startTaskAction,
} from "@/server/actions/trials";
import type { TaskDef } from "@/lib/tasks/catalog";

type Phase = "ready" | "showing" | "input" | "feedback";

export function DigitSpanTask({
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

const SHOW_INTERVAL_MS = 900;

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
  const [shownIndex, setShownIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [sequence, setSequence] = useState<number[]>([]);
  const presentedAtRef = useRef(new Date());
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startTaskAction(sessionId, taskCode);
  }, [sessionId, taskCode]);

  function startTrial() {
    const seed = trialSeed(sessionId, taskCode, trialIndex);
    const seq = generateDigitSequence(seed, state.level);
    setSequence(seq);
    setShownIndex(-1);
    setUserInput("");
    setLastCorrect(null);
    setPhase("showing");
    presentedAtRef.current = new Date();
  }

  // Animazione di presentazione cifra-per-cifra
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

  // Avvio automatico del primo trial
  useEffect(() => {
    if (phase === "ready" && trialIndex === 0) {
      const t = setTimeout(startTrial, 500);
      return () => clearTimeout(t);
    }
  }, [phase, trialIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmitInput() {
    const expected = reverseSequence(sequence).join("");
    const given = userInput.replace(/\D/g, "");
    const correct = given === expected;
    setLastCorrect(correct);
    setPhase("feedback");

    const respondedAt = new Date();
    await recordTrialAction({
      sessionId,
      taskCode,
      itemSeed: trialSeed(sessionId, taskCode, trialIndex),
      itemMeta: { level: state.level, sequence },
      response: { input: given },
      rtMs: respondedAt.getTime() - presentedAtRef.current.getTime(),
      correct,
      presentedAt: presentedAtRef.current.toISOString(),
      respondedAt: respondedAt.toISOString(),
    });

    const nextState = applyAttempt(state, correct);
    setState(nextState);

    if (nextState.done) {
      // Score grezzo = span massimo, modulato dalla stabilita
      const rawScore =
        nextState.maxLevelReached +
        (nextState.totalAttempts > 0
          ? nextState.totalCorrect / nextState.totalAttempts / 4
          : 0);
      await completeTaskAction({
        sessionId,
        taskCode,
        rawScore,
        details: {
          maxLevelReached: nextState.maxLevelReached,
          totalCorrect: nextState.totalCorrect,
          totalAttempts: nextState.totalAttempts,
        },
      });
      setTimeout(onDone, 1500);
    }
  }

  function continueAfterFeedback() {
    setTrialIndex((i) => i + 1);
    setPhase("ready");
    setTimeout(startTrial, 400);
  }

  return (
    <div className="mt-6">
      <div className="text-sm text-foreground-muted">
        Livello {state.level} · Tentativi al livello {state.attemptsAtLevel} ·
        Span massimo {state.maxLevelReached}
      </div>

      <div className="mt-8 flex min-h-[180px] items-center justify-center rounded-lg border border-border bg-surface-soft p-8">
        {phase === "ready" && (
          <p className="text-foreground-muted">Preparati...</p>
        )}
        {phase === "showing" && (
          <p className="font-mono text-7xl font-semibold text-navy">
            {shownIndex >= 0 && shownIndex < sequence.length
              ? sequence[shownIndex]
              : "·"}
          </p>
        )}
        {phase === "input" && (
          <div className="w-full max-w-md">
            <label
              htmlFor="ds-input"
              className="block text-sm text-foreground-muted"
            >
              Digita le cifre nell&apos;ordine inverso
            </label>
            <input
              id="ds-input"
              autoFocus
              autoComplete="off"
              inputMode="numeric"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void onSubmitInput();
              }}
              className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 text-center font-mono text-3xl tracking-widest text-navy outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            />
            <button
              type="button"
              onClick={() => void onSubmitInput()}
              className="mt-4 w-full rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft"
            >
              Conferma
            </button>
          </div>
        )}
        {phase === "feedback" && (
          <div className="text-center">
            <p
              className={`text-2xl font-semibold ${
                lastCorrect ? "text-teal-strong" : "text-foreground-muted"
              }`}
            >
              {lastCorrect ? "Risposta corretta" : "Risposta non corretta"}
            </p>
            {!state.done && (
              <button
                type="button"
                onClick={continueAfterFeedback}
                className="mt-6 rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft"
              >
                Prossima sequenza
              </button>
            )}
            {state.done && (
              <p className="mt-4 text-sm text-foreground-muted">
                Hai raggiunto un span massimo di {state.maxLevelReached}.
                Salvataggio...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
