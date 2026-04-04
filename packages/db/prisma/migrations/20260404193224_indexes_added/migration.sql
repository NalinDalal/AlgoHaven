-- CreateIndex
CREATE INDEX "Submission_userId_status_idx" ON "Submission"("userId", "status");

-- CreateIndex
CREATE INDEX "Submission_userId_createdAt_idx" ON "Submission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_userId_status_createdAt_idx" ON "Submission"("userId", "status", "createdAt");
