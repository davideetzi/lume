"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { TaskDef } from "@/lib/tasks/catalog";

type Phase = "instructions" | "practice" | "block" | "done";

export type TaskShellProps = {
  taskDef: TaskDef;
  /**
   * Opzionale: mostra un blocco di pratica con feedback prima del blocco
   * vero. Se omesso, dopo le istruzioni si passa direttamente al blocco.
   */
  practice?: (props: { onPracticeDone: () => void }) => ReactNode;
  block: (props: { onBlockDone: () => void }) => ReactNode;
  done?: ReactNode;
};

export function TaskShell({
  taskDef,
  practice,
  block,
  done,
}: TaskShellProps) {
  const [phase, setPhase] = useState<Phase>("instructions");

  if (phase === "instructions") {
    return (
      <Card>
        <Heading taskDef={taskDef} />
        <p className="mt-4 text-base leading-relaxed text-foreground-muted">
          {taskDef.instructions}
        </p>
        <div className="mt-6 grid gap-3 text-sm text-foreground-muted sm:grid-cols-3">
          <Meta label="Fattore" value={taskDef.factor} />
          <Meta
            label="Tempo stimato"
            value={`circa ${taskDef.estimatedMinutes} minuti`}
          />
          {taskDef.blockSize && (
            <Meta
              label="Numero di prove"
              value={`${taskDef.blockSize} prove`}
            />
          )}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPhase(practice ? "practice" : "block")}
            className="rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft"
          >
            {practice ? "Inizia con un esempio" : "Inizia"}
          </button>
          <Link
            href="/assessment"
            className="rounded-md border border-border px-6 py-3 text-base font-medium text-navy hover:border-teal"
          >
            Torna alla sessione
          </Link>
        </div>
      </Card>
    );
  }

  if (phase === "practice" && practice) {
    return (
      <Card>
        <Heading taskDef={taskDef} note="Esempio guidato" />
        {practice({ onPracticeDone: () => setPhase("block") })}
      </Card>
    );
  }

  if (phase === "block") {
    return (
      <Card>
        <Heading taskDef={taskDef} note="Blocco principale" />
        {block({ onBlockDone: () => setPhase("done") })}
      </Card>
    );
  }

  return (
    <Card>
      <Heading taskDef={taskDef} note="Completato" />
      {done ?? <DefaultDone taskCode={taskDef.code} />}
    </Card>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-8 shadow-sm">
      {children}
    </div>
  );
}

function Heading({
  taskDef,
  note,
}: {
  taskDef: TaskDef;
  note?: string;
}) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-teal">
        {taskDef.factor}
        {note ? ` · ${note}` : ""}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-navy">
        {taskDef.title}
      </h2>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-foreground-muted">
        {label}
      </div>
      <div className="mt-1 text-navy">{value}</div>
    </div>
  );
}

function DefaultDone({ taskCode }: { taskCode: string }) {
  return (
    <div className="mt-2">
      <p className="text-foreground-muted">
        Hai completato questa attività. Le tue risposte sono state salvate.
      </p>
      <Link
        href="/assessment"
        className="mt-6 inline-flex rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft"
      >
        Continua con la sessione
      </Link>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-4 text-xs text-foreground-muted">
          (debug) task: <code>{taskCode}</code>
        </p>
      )}
    </div>
  );
}
