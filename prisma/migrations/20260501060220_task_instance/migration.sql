-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');

-- CreateTable
CREATE TABLE "TaskInstance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'not_started',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rawScore" DOUBLE PRECISION,
    "details" JSONB,

    CONSTRAINT "TaskInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskInstance_sessionId_status_idx" ON "TaskInstance"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskInstance_sessionId_taskCode_key" ON "TaskInstance"("sessionId", "taskCode");

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
