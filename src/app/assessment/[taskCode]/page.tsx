import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { requireConsent } from "@/lib/auth-guards";
import { getOrCreateActiveSession } from "@/server/sessions";
import { TASKS, type TaskCode } from "@/lib/tasks/catalog";
import { MatrixTask } from "@/components/tasks/matrix/matrix-task";
import { SeriesTask } from "@/components/tasks/series/series-task";
import { DigitSpanTask } from "@/components/tasks/digit-span/digit-span-task";
import { CorsiTask } from "@/components/tasks/corsi/corsi-task";
import { NbackTask } from "@/components/tasks/nback/nback-task";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ taskCode: string }>;
}) {
  const { taskCode } = await params;
  const def = TASKS[taskCode as TaskCode];
  return { title: def?.title ?? "Attivita" };
}

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskCode: string }>;
}) {
  const { taskCode } = await params;
  const def = TASKS[taskCode as TaskCode];
  if (!def) notFound();

  const { session: authSession } = await requireConsent();
  const session = await getOrCreateActiveSession(authSession.user.id);

  const ti = session.taskInstances.find((t) => t.taskCode === taskCode);
  if (ti?.status === "completed") {
    redirect("/assessment");
  }

  return (
    <PageShell title={def.title} maxWidth="md">
      <TaskRouter
        taskCode={taskCode as TaskCode}
        sessionId={session.id}
        def={def}
      />
    </PageShell>
  );
}

function TaskRouter({
  taskCode,
  sessionId,
  def,
}: {
  taskCode: TaskCode;
  sessionId: string;
  def: (typeof TASKS)[TaskCode];
}) {
  switch (taskCode) {
    case "matrix":
      return <MatrixTask sessionId={sessionId} taskDef={def} totalTrials={def.blockSize} />;
    case "series":
      return <SeriesTask sessionId={sessionId} taskDef={def} totalTrials={def.blockSize} />;
    case "digit_span_back":
      return <DigitSpanTask sessionId={sessionId} taskDef={def} />;
    case "corsi":
      return <CorsiTask sessionId={sessionId} taskDef={def} />;
    case "nback":
      return <NbackTask sessionId={sessionId} taskDef={def} totalTrials={def.blockSize} />;
    default:
      return <ComingSoon code={taskCode} />;
  }
}

function ComingSoon({ code }: { code: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-soft p-8 text-foreground-muted">
      <p>
        Questa attività verrà implementata nelle prossime sessioni di
        sviluppo. Codice task:{" "}
        <code className="font-mono text-sm">{code}</code>.
      </p>
    </div>
  );
}
