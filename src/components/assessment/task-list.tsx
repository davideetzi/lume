import Link from "next/link";
import { TASK_ORDER, TASKS } from "@/lib/tasks/catalog";
import type { SessionProgress } from "@/server/sessions";
import { cn } from "@/lib/utils";

const STATUS_LABEL = {
  not_started: "Da iniziare",
  in_progress: "In corso",
  completed: "Completato",
  skipped: "Saltato",
};

export function TaskList({ progress }: { progress: SessionProgress }) {
  return (
    <ol className="divide-y divide-border rounded-lg border border-border bg-surface">
      {TASK_ORDER.map((code, i) => {
        const def = TASKS[code];
        const status = progress.byCode[code];
        const isNext = progress.nextTask === code;
        return (
          <li
            key={code}
            className={cn(
              "flex flex-wrap items-center justify-between gap-4 px-6 py-4",
              isNext && "bg-surface-soft",
            )}
          >
            <div className="flex items-start gap-4">
              <span className="mt-1 h-7 w-7 shrink-0 rounded-full bg-surface-soft text-center text-sm font-medium leading-7 text-foreground-muted">
                {i + 1}
              </span>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="font-semibold text-navy">{def.title}</h3>
                  <span className="font-mono text-xs text-teal">
                    {def.factor}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground-muted">
                  {def.shortDesc}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  Tempo stimato: {def.estimatedMinutes} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  status === "completed" &&
                    "bg-teal/10 text-teal-strong",
                  status === "in_progress" &&
                    "bg-yellow-100 text-yellow-800",
                  status === "not_started" &&
                    "bg-surface-soft text-foreground-muted",
                  status === "skipped" &&
                    "bg-red-50 text-red-700",
                )}
              >
                {STATUS_LABEL[status]}
              </span>
              {status !== "completed" && (
                <Link
                  href={`/assessment/${code}`}
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-medium",
                    isNext
                      ? "bg-navy text-white hover:bg-navy-soft"
                      : "border border-border text-navy hover:border-teal",
                  )}
                >
                  {status === "in_progress" ? "Riprendi" : "Inizia"}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
