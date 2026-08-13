-- CreateTable
CREATE TABLE "VirtualContestSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VirtualContestSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VirtualContestSession_userId_contestId_key" ON "VirtualContestSession"("userId", "contestId");

-- CreateIndex
CREATE INDEX "VirtualContestSession_contestId_idx" ON "VirtualContestSession"("contestId");

-- AddForeignKey
ALTER TABLE "VirtualContestSession" ADD CONSTRAINT "VirtualContestSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualContestSession" ADD CONSTRAINT "VirtualContestSession_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
