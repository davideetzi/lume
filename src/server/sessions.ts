import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { TASK_ORDER, TASKS, type TaskCode } from "@/lib/tasks/catalog";
import { currentConsentVersion } from "@/lib/consent/version";

export type SessionWithProgress = Awaited<
  ReturnType<typeof getOrCreateActiveSession>
>;

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

/**
 * Restituisce l'unica sessione attiva (in_progress) per l'utente, oppure
 * la crea. Inizializza anche le 11 TaskInstance "not_started".
 */
export async function getOrCreateActiveSession(userId: string) {
  return prisma.$transaction(async (tx) => {
    let session = await tx.assessmentSession.findFirst({
      where: { userId, status: "in_progress" },
      orderBy: { startedAt: "desc" },
      include: { taskInstances: true },
    });

    if (!session) {
      session = await tx.assessmentSession.create({
        data: {
          userId,
          appVersion: APP_VERSION,
          consentVersion: currentConsentVersion(),
          taskInstances: {
            create: TASK_ORDER.map((taskCode) => ({ taskCode })),
          },
        },
        include: { taskInstances: true },
      });
    } else if (session.taskInstances.length === 0) {
      // sessione esistente senza task instances (vecchia)
      await tx.taskInstance.createMany({
        data: TASK_ORDER.map((taskCode) => ({
          sessionId: session!.id,
          taskCode,
        })),
      });
      session = await tx.assessmentSession.findUniqueOrThrow({
        where: { id: session.id },
        include: { taskInstances: true },
      });
    }

    return session;
  });
}

export async function startTask(sessionId: string, taskCode: TaskCode) {
  await prisma.taskInstance.update({
    where: {
      sessionId_taskCode: { sessionId, taskCode },
    },
    data: {
      status: "in_progress",
      startedAt: new Date(),
    },
  });
}

export async function recordTrial(args: {
  sessionId: string;
  taskCode: TaskCode;
  itemSeed: string;
  itemMeta: Prisma.InputJsonValue;
  response: Prisma.InputJsonValue;
  rtMs?: number;
  correct?: boolean;
  presentedAt: Date;
  respondedAt?: Date;
}) {
  return prisma.trial.create({
    data: {
      sessionId: args.sessionId,
      taskCode: args.taskCode,
      itemSeed: args.itemSeed,
      itemMeta: args.itemMeta,
      response: args.response,
      rtMs: args.rtMs ?? null,
      correct: args.correct ?? null,
      presentedAt: args.presentedAt,
      respondedAt: args.respondedAt ?? null,
    },
  });
}

export async function completeTask(args: {
  sessionId: string;
  taskCode: TaskCode;
  rawScore: number;
  details?: Prisma.InputJsonValue;
}) {
  await prisma.taskInstance.update({
    where: {
      sessionId_taskCode: {
        sessionId: args.sessionId,
        taskCode: args.taskCode,
      },
    },
    data: {
      status: "completed",
      completedAt: new Date(),
      rawScore: args.rawScore,
      details: args.details,
    },
  });
}

export type SessionProgress = {
  total: number;
  completed: number;
  inProgress: number;
  remaining: number;
  nextTask: TaskCode | null;
  estimatedRemainingMinutes: number;
  byCode: Record<
    TaskCode,
    "not_started" | "in_progress" | "completed" | "skipped"
  >;
};

export function computeProgress(
  taskInstances: Array<{
    taskCode: string;
    status: "not_started" | "in_progress" | "completed" | "skipped";
  }>,
): SessionProgress {
  const byCode = Object.fromEntries(
    TASK_ORDER.map((code) => [code, "not_started"]),
  ) as SessionProgress["byCode"];

  for (const ti of taskInstances) {
    if ((TASK_ORDER as readonly string[]).includes(ti.taskCode)) {
      byCode[ti.taskCode as TaskCode] = ti.status;
    }
  }

  const counts = { completed: 0, inProgress: 0, remaining: 0 };
  let nextTask: TaskCode | null = null;
  let estimatedRemainingMinutes = 0;

  for (const code of TASK_ORDER) {
    const status = byCode[code];
    if (status === "completed") counts.completed++;
    else if (status === "in_progress") counts.inProgress++;
    else {
      counts.remaining++;
      estimatedRemainingMinutes += TASKS[code].estimatedMinutes;
      if (!nextTask) nextTask = code;
    }
  }

  return {
    total: TASK_ORDER.length,
    completed: counts.completed,
    inProgress: counts.inProgress,
    remaining: counts.remaining,
    nextTask,
    estimatedRemainingMinutes,
    byCode,
  };
}

/**
 * Marca la sessione come completata. Lo scoring per fattore + ICL viene
 * fatto da pipeline separata in sessione 7.
 */
export async function finalizeSession(sessionId: string) {
  await prisma.assessmentSession.update({
    where: { id: sessionId },
    data: { status: "completed", completedAt: new Date() },
  });
}
