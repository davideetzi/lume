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
import { SymbolMatchTask } from "@/components/tasks/symbol-match/symbol-match-task";
import { ChoiceRtTask } from "@/components/tasks/choice-rt/choice-rt-task";
import { MentalRotationTask } from "@/components/tasks/mental-rotation/mental-rotation-task";
import { PaperFoldingTask } from "@/components/tasks/paper-folding/paper-folding-task";
import { VocabularyTask } from "@/components/tasks/vocabulary/vocabulary-task";
import { VerbalInferenceTask } from "@/components/tasks/verbal-inference/verbal-inference-task";
import {
  loadVocabularyBank,
  selectVocabItems,
} from "@/lib/items/vocabulary";
import {
  loadVerbalInferenceBank,
  selectVerbalItems,
} from "@/lib/items/verbal-inference";

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

  // Tasks Gc richiedono caricamento item bank lato server
  if (taskCode === "vocabulary") {
    const bank = await loadVocabularyBank();
    const items = selectVocabItems(
      bank,
      `${session.id}::vocabulary`,
      def.blockSize ?? 30,
    );
    return (
      <PageShell title={def.title} maxWidth="md">
        <VocabularyTask sessionId={session.id} taskDef={def} items={items} />
      </PageShell>
    );
  }

  if (taskCode === "verbal_inference") {
    const bank = await loadVerbalInferenceBank();
    const items = selectVerbalItems(
      bank,
      `${session.id}::verbal_inference`,
      def.blockSize ?? 30,
    );
    return (
      <PageShell title={def.title} maxWidth="md">
        <VerbalInferenceTask
          sessionId={session.id}
          taskDef={def}
          items={items}
        />
      </PageShell>
    );
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
    case "symbol_match":
      return <SymbolMatchTask sessionId={sessionId} taskDef={def} totalTrials={def.blockSize} />;
    case "choice_rt":
      return <ChoiceRtTask sessionId={sessionId} taskDef={def} totalTrials={def.blockSize} />;
    case "mental_rotation":
      return <MentalRotationTask sessionId={sessionId} taskDef={def} totalTrials={def.blockSize} />;
    case "paper_folding":
      return <PaperFoldingTask sessionId={sessionId} taskDef={def} totalTrials={def.blockSize} />;
    default:
      return null;
  }
}
