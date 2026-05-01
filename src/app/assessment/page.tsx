import { PageShell } from "@/components/ui/page-shell";
import { requireConsent } from "@/lib/auth-guards";
import {
  computeProgress,
  finalizeSession,
  getOrCreateActiveSession,
} from "@/server/sessions";
import { TaskList } from "@/components/assessment/task-list";
import { redirect } from "next/navigation";

export const metadata = { title: "La tua sessione" };

export default async function AssessmentHubPage() {
  const { session: authSession } = await requireConsent();
  const session = await getOrCreateActiveSession(authSession.user.id);
  const progress = computeProgress(session.taskInstances);

  return (
    <PageShell
      title="La tua sessione"
      intro="Undici attività, cinque dimensioni. Procedi con la cadenza che senti tua. Puoi sospendere e riprendere quando vuoi."
      maxWidth="lg"
    >
      <div className="space-y-8">
        <ProgressSummary progress={progress} />
        <TaskList progress={progress} />
        {progress.completed === progress.total && (
          <FinalizeBlock sessionId={session.id} />
        )}
      </div>
    </PageShell>
  );
}

function ProgressSummary({
  progress,
}: {
  progress: ReturnType<typeof computeProgress>;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-soft p-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Completate" value={`${progress.completed} / ${progress.total}`} />
        <Stat label="In corso" value={progress.inProgress.toString()} />
        <Stat label="Da fare" value={progress.remaining.toString()} />
        <Stat
          label="Tempo restante"
          value={`~${progress.estimatedRemainingMinutes} min`}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-foreground-muted">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-navy">{value}</div>
    </div>
  );
}

async function FinalizeBlock({ sessionId }: { sessionId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await finalizeSession(sessionId);
        redirect(`/results/${sessionId}`);
      }}
      className="rounded-lg border border-teal/30 bg-teal/5 p-6"
    >
      <h2 className="text-lg font-semibold text-navy">
        Hai completato tutte le attività
      </h2>
      <p className="mt-2 text-sm text-foreground-muted">
        Quando sei pronto, finalizza la sessione per vedere il tuo profilo.
      </p>
      <button
        type="submit"
        className="mt-4 rounded-md bg-navy px-6 py-3 text-base font-medium text-white hover:bg-navy-soft"
      >
        Vedi il tuo profilo
      </button>
    </form>
  );
}
