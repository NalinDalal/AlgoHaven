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

const jobQueue: Job[] = [];
let isProcessing = false;

export function enqueueSubmission(job: Job): void {
  jobQueue.push(job);
}

export function getQueueLength(): number {
  return jobQueue.length;
}

export function isQueueProcessing(): boolean {
  return isProcessing;
}

export function getNextJob(): Job | undefined {
  return jobQueue.shift();
}

export function setProcessing(value: boolean): void {
  isProcessing = value;
}

export function markProcessing(): void {
  isProcessing = true;
}

export function markIdle(): void {
  isProcessing = false;
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

  console.log(`[Worker] Processing submission ${job.submissionId}`);
  console.log(
    `[Worker] Language: ${job.language}, Test cases: ${job.testCases.length}`,
  );

  let allAccepted = true;
  let totalTime = 0;

  for (const testCase of job.testCases) {
    const result = await runCode(job.code, testCase.input, job.language);
    totalTime += result.executionTimeMs;

    const actual = result.stdout.trim();
    const expected = testCase.expectedOutput.trim();

    if (result.status === "TLE") {
      console.log(`[Worker] Test case TLE`);
      allAccepted = false;
    } else if (result.status === "RUNTIME_ERROR") {
      console.log(`[Worker] Test case RUNTIME_ERROR: ${result.stderr}`);
      allAccepted = false;
    } else if (actual === expected) {
      console.log(`[Worker] Test case ACCEPTED`);
    } else {
      console.log(`[Worker] Test case WRONG_ANSWER`);
      console.log(`[Worker]   Expected: "${expected}"`);
      console.log(`[Worker]   Got: "${actual}"`);
      allAccepted = false;
    }
  }

  const finalStatus = allAccepted ? "ACCEPTED" : "WRONG_ANSWER";
  console.log(
    `[Worker] Submission ${job.submissionId} final: ${finalStatus} (${totalTime}ms)`,
  );

  try {
    await updateSubmission(job.submissionId, finalStatus, totalTime);
    console.log(
      `[Worker] Updated submission ${job.submissionId} to ${finalStatus}`,
    );
  } catch (err) {
    console.error(`[Worker] Error updating submission:`, err);
  }

  isProcessing = false;
  setTimeout(() => processNext(runCode, updateSubmission), 100);
}
