"use client";

import { useEffect, useRef, useState } from "react";
import { TaskShell } from "@/components/tasks/shared/task-shell";
import {
  completeTaskAction,
  recordTrialAction,
  startTaskAction,
} from "@/server/actions/trials";
import type { TaskDef } from "@/lib/tasks/catalog";
import type { VocabPresented } from "@/lib/items/vocabulary";

export function VocabularyTask({
  sessionId,
  taskDef,
  items,
}: {
  sessionId: string;
  taskDef: TaskDef;
  items: VocabPresented[];
}) {
  return (
    <TaskShell
      taskDef={taskDef}
      block={({ onBlockDone }) => (
        <Block
          sessionId={sessionId}
          taskCode={taskDef.code}
          items={items}
          onDone={onBlockDone}
        />
      )}
    />
  );
}

function Block({
  sessionId,
  taskCode,
  items,
  onDone,
}: {
  sessionId: string;
  taskCode: TaskDef["code"];
  items: VocabPresented[];
  onDone: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const correctRef = useRef(0);
  const presentedAtRef = useRef(new Date());
  const startedRef = useRef(false);
  const item = items[idx]!;

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
      itemSeed: `bank::vocab::${item.externalId}`,
      itemMeta: {
        externalId: item.externalId,
        difficultyTier: item.difficultyTier,
        draft: item.draft,
      },
      response: { chosenIndex: optionIdx },
      rtMs: respondedAt.getTime() - presentedAtRef.current.getTime(),
      correct,
      presentedAt: presentedAtRef.current.toISOString(),
      respondedAt: respondedAt.toISOString(),
    });
    if (idx + 1 >= items.length) {
      // raw score = somma corretti pesati per tier (1, 2, 3)
      let weighted = 0;
      const tierCount: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
      // approssimazione client-side: peso uniforme, scoring definitivo
      // viene rifatto server-side in sessione 7 con i Trial.
      void tierCount;
      void weighted;
      await completeTaskAction({
        sessionId,
        taskCode,
        rawScore: correctRef.current,
        details: {
          totalTrials: items.length,
          correctCount: correctRef.current,
          draftItemBank: items.some((i) => i.draft),
        },
      });
      onDone();
    } else {
      setIdx((i) => i + 1);
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between text-sm text-foreground-muted">
        <span>
          Trial {idx + 1} di {items.length}
        </span>
        <span>Difficolta {item.difficultyTier}</span>
      </div>
      <div className="mt-6 rounded-lg border border-border bg-surface-soft p-8">
        <p className="text-xs uppercase tracking-widest text-teal">
          Quale e il significato di
        </p>
        <p className="mt-3 text-3xl font-semibold text-navy">{item.word}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {item.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={submitting}
            onClick={() => void answer(i)}
            className="rounded-md border border-border bg-surface px-4 py-4 text-left text-base text-navy hover:border-teal disabled:opacity-60"
          >
            <span className="mr-2 text-xs font-mono text-foreground-muted">
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
