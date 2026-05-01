-- CreateEnum
CREATE TYPE "FactorCode" AS ENUM ('Gf', 'Gwm', 'Gs', 'Gv', 'Gc');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('in_progress', 'completed', 'abandoned');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "birthYear" INTEGER,
    "gender" TEXT,
    "educationLevel" TEXT,
    "nativeLanguage" TEXT,
    "neurodivergence" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "serviceConsent" BOOLEAN NOT NULL,
    "researchConsent" BOOLEAN NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'in_progress',
    "appVersion" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "qcPassed" BOOLEAN,
    "qcFlags" JSONB,

    CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trial" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "itemSeed" TEXT NOT NULL,
    "itemMeta" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "rtMs" INTEGER,
    "correct" BOOLEAN,
    "presentedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "Trial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemBankEntry" (
    "id" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "irtA" DOUBLE PRECISION,
    "irtB" DOUBLE PRECISION,
    "irtC" DOUBLE PRECISION,
    "difficultyTier" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemBankEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactorScore" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "factor" "FactorCode" NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "zScore" DOUBLE PRECISION NOT NULL,
    "alpha" DOUBLE PRECISION,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formulaVersion" TEXT NOT NULL DEFAULT 'v1',

    CONSTRAINT "FactorScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompositeScore" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "icl" DOUBLE PRECISION NOT NULL,
    "se" DOUBLE PRECISION NOT NULL,
    "lowerCI" DOUBLE PRECISION NOT NULL,
    "upperCI" DOUBLE PRECISION NOT NULL,
    "qcPassed" BOOLEAN NOT NULL,
    "formulaVersion" TEXT NOT NULL DEFAULT 'v1',
    "weights" JSONB NOT NULL,
    "sampleStatId" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompositeScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleStatBatch" (
    "id" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionCount" INTEGER NOT NULL,
    "formulaVersion" TEXT NOT NULL DEFAULT 'v1',

    CONSTRAINT "SampleStatBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleStat" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "factor" "FactorCode" NOT NULL,
    "mean" DOUBLE PRECISION NOT NULL,
    "sd" DOUBLE PRECISION NOT NULL,
    "n" INTEGER NOT NULL,

    CONSTRAINT "SampleStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchExport" (
    "id" TEXT NOT NULL,
    "surrogateId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentVersion" TEXT NOT NULL,

    CONSTRAINT "ResearchExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_sessionToken_key" ON "AuthSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_signedAt_idx" ON "ConsentRecord"("userId", "signedAt");

-- CreateIndex
CREATE INDEX "AssessmentSession_userId_startedAt_idx" ON "AssessmentSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "AssessmentSession_status_idx" ON "AssessmentSession"("status");

-- CreateIndex
CREATE INDEX "Trial_sessionId_taskCode_idx" ON "Trial"("sessionId", "taskCode");

-- CreateIndex
CREATE INDEX "Trial_taskCode_idx" ON "Trial"("taskCode");

-- CreateIndex
CREATE INDEX "ItemBankEntry_taskCode_active_idx" ON "ItemBankEntry"("taskCode", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ItemBankEntry_taskCode_externalId_version_key" ON "ItemBankEntry"("taskCode", "externalId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FactorScore_sessionId_factor_key" ON "FactorScore"("sessionId", "factor");

-- CreateIndex
CREATE UNIQUE INDEX "CompositeScore_sessionId_key" ON "CompositeScore"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SampleStat_batchId_factor_key" ON "SampleStat"("batchId", "factor");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchExport_surrogateId_key" ON "ResearchExport"("surrogateId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchExport_sessionId_key" ON "ResearchExport"("sessionId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactorScore" ADD CONSTRAINT "FactorScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompositeScore" ADD CONSTRAINT "CompositeScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompositeScore" ADD CONSTRAINT "CompositeScore_sampleStatId_fkey" FOREIGN KEY ("sampleStatId") REFERENCES "SampleStatBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleStat" ADD CONSTRAINT "SampleStat_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "SampleStatBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
