/*
  Warnings:

  - You are about to drop the column `challengeId` on the `ContestProblem` table. All the data in the column will be lost.
  - You are about to drop the column `challengeId` on the `RejudgeJob` table. All the data in the column will be lost.
  - You are about to drop the column `challengeId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `challengeId` on the `TestCase` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contestId,problemId]` on the table `ContestProblem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `problemId` to the `ContestProblem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problemId` to the `RejudgeJob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problemId` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problemId` to the `TestCase` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ContestProblem" DROP CONSTRAINT "ContestProblem_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "TestCase" DROP CONSTRAINT "TestCase_challengeId_fkey";

-- DropIndex
DROP INDEX "ContestProblem_contestId_challengeId_key";

-- DropIndex
DROP INDEX "RejudgeJob_challengeId_idx";

-- DropIndex
DROP INDEX "Submission_challengeId_idx";

-- DropIndex
DROP INDEX "TestCase_challengeId_idx";

-- AlterTable
ALTER TABLE "ContestProblem" DROP COLUMN "challengeId",
ADD COLUMN     "problemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RejudgeJob" DROP COLUMN "challengeId",
ADD COLUMN     "problemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "challengeId",
ADD COLUMN     "problemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TestCase" DROP COLUMN "challengeId",
ADD COLUMN     "problemId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ContestProblem_contestId_problemId_key" ON "ContestProblem"("contestId", "problemId");

-- CreateIndex
CREATE INDEX "RejudgeJob_problemId_idx" ON "RejudgeJob"("problemId");

-- CreateIndex
CREATE INDEX "Submission_problemId_idx" ON "Submission"("problemId");

-- CreateIndex
CREATE INDEX "TestCase_problemId_idx" ON "TestCase"("problemId");

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
