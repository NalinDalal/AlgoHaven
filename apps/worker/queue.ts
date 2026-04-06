export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface Job {
  submissionId: string;
  code: string;
  language: string;
  testCases: TestCase[];
}

import { worker } from "@algohaven/logger";

const jobQueue: Job[] = [];
let isProcessing = false;
let currentJob: Job | null = null;

export function enqueueSubmission(job: Job): void {
  jobQueue.push(job);
}

export function getQueueLength(): number {
  return jobQueue.length + (currentJob ? 1 : 0);
}

export function isQueueProcessing(): boolean {
  return isProcessing;
}

export function getCurrentJob(): Job | null {
  return currentJob;
}

export function getNextJob(): Job | undefined {
  currentJob = jobQueue.shift() ?? null;
  return currentJob ?? undefined;
}

export function clearCurrentJob(): void {
  currentJob = null;
}

export function setProcessing(value: boolean): void {
  isProcessing = value;
}

export function markProcessing(): void {
  isProcessing = true;
}

export function markIdle(): void {
  isProcessing = false;
  currentJob = null;
}

export async function processNext(
  runCode: (
    code: string,
    input: string,
    language: string,
  ) => Promise<{
    status: string;
    stdout: string;
    stderr: string;
    executionTimeMs: number;
  }>,
  updateSubmission: (
    submissionId: string,
    status: string,
    executionTimeMs: number,
  ) => Promise<void>,
): Promise<void> {
  if (jobQueue.length === 0 || isProcessing) return;

  isProcessing = true;
  const job = jobQueue.shift();
  if (!job) {
    isProcessing = false;
    return;
  }

  currentJob = job;

  worker.info(
    {
      submissionId: job.submissionId,
      language: job.language,
      testCases: job.testCases.length,
    },
    "Processing submission",
  );

  let allAccepted = true;
  let totalTime = 0;

  for (const testCase of job.testCases) {
    const result = await runCode(job.code, testCase.input, job.language);
    totalTime += result.executionTimeMs;

    const actual = result.stdout.trim();
    const expected = testCase.expectedOutput.trim();

    if (result.status === "TLE") {
      worker.warn({ submissionId: job.submissionId }, "Test case TLE");
      allAccepted = false;
    } else if (result.status === "RUNTIME_ERROR") {
      worker.warn(
        { submissionId: job.submissionId, stderr: result.stderr },
        "Test case RUNTIME_ERROR",
      );
      allAccepted = false;
    } else if (actual === expected) {
      worker.debug({ submissionId: job.submissionId }, "Test case ACCEPTED");
    } else {
      worker.warn(
        { submissionId: job.submissionId, expected, actual },
        "Test case WRONG_ANSWER",
      );
      allAccepted = false;
    }
  }

  const finalStatus = allAccepted ? "ACCEPTED" : "WRONG_ANSWER";
  worker.info(
    {
      submissionId: job.submissionId,
      status: finalStatus,
      totalTimeMs: totalTime,
    },
    "Submission final result",
  );

  try {
    await updateSubmission(job.submissionId, finalStatus, totalTime);
    worker.info(
      { submissionId: job.submissionId, status: finalStatus },
      "Submission updated",
    );
  } catch (err) {
    worker.error(
      { err, submissionId: job.submissionId },
      "Error updating submission",
    );
  }

  isProcessing = false;
  currentJob = null;
  setTimeout(() => processNext(runCode, updateSubmission), 100);
}
