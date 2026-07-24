-- AlterTable
ALTER TABLE "RejudgeJob" ADD COLUMN IF NOT EXISTS "submissionId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RejudgeJob_submissionId_idx" ON "RejudgeJob"("submissionId");
