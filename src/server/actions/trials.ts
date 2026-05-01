"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  completeTask,
  recordTrial,
  startTask,
} from "@/server/sessions";
import { TASKS, type TaskCode } from "@/lib/tasks/catalog";

async function ensureOwnership(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Non autenticato");
  }
  const owner = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, status: true },
  });
  if (!owner || owner.userId !== session.user.id) {
    throw new Error("Sessione non trovata");
  }
  if (owner.status !== "in_progress") {
    throw new Error("La sessione non e piu attiva");
  }
  return session.user.id;
}

export async function startTaskAction(
  sessionId: string,
  taskCode: TaskCode,
) {
  await ensureOwnership(sessionId);
  await startTask(sessionId, taskCode);
}

export async function recordTrialAction(args: {
  sessionId: string;
  taskCode: TaskCode;
  itemSeed: string;
  itemMeta: Prisma.InputJsonValue;
  response: Prisma.InputJsonValue;
  rtMs?: number;
  correct?: boolean;
  presentedAt: string; // ISO
  respondedAt?: string; // ISO
}) {
  await ensureOwnership(args.sessionId);
  if (!(args.taskCode in TASKS)) throw new Error("taskCode invalido");
  await recordTrial({
    sessionId: args.sessionId,
    taskCode: args.taskCode,
    itemSeed: args.itemSeed,
    itemMeta: args.itemMeta,
    response: args.response,
    rtMs: args.rtMs,
    correct: args.correct,
    presentedAt: new Date(args.presentedAt),
    respondedAt: args.respondedAt ? new Date(args.respondedAt) : undefined,
  });
}

export async function completeTaskAction(args: {
  sessionId: string;
  taskCode: TaskCode;
  rawScore: number;
  details?: Prisma.InputJsonValue;
}) {
  await ensureOwnership(args.sessionId);
  if (!(args.taskCode in TASKS)) throw new Error("taskCode invalido");
  await completeTask(args);
  revalidatePath("/assessment");
  revalidatePath(`/assessment/${args.taskCode}`);
}
