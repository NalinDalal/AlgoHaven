import { serve } from "bun";
import { runCode } from "./docker";
import {
  enqueueSubmission,
  getQueueLength,
  getNextJob,
  markProcessing,
  markIdle,
  isQueueProcessing,
  getCurrentJob,
  type Job,
} from "./queue";
import { handleEnqueue, handleHealth } from "./api";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const WORKER_SECRET = process.env.WORKER_SECRET || "dev-secret-change-in-prod";

async function updateSubmission(
  submissionId: string,
  status: string,
  executionTimeMs: number,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/worker/update-submission`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-worker-secret": WORKER_SECRET,
    },
    body: JSON.stringify({
      submissionId,
      status,
      executionTimeMs,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update submission: ${res.status}`);
  }
}

function startQueueProcessor(): void {
  const runJob = async () => {
    if (getQueueLength() === 0 || isQueueProcessing()) {
      setTimeout(runJob, 100);
      return;
    }

    const job = getNextJob();
    if (!job) {
      setTimeout(runJob, 100);
      return;
    }

    markProcessing();
    await processJob(job);
    markIdle();

    setTimeout(runJob, 100);
  };

  setTimeout(runJob, 100);
}

async function processJob(job: Job): Promise<void> {
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
}

const server = serve({
  port: 3002,
  fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/api/worker/enqueue") {
      return handleEnqueue(req, WORKER_SECRET, enqueueSubmission);
    }

    if (req.method === "GET" && url.pathname === "/api/worker/health") {
      return handleHealth(getQueueLength)();
    }

    return new Response("Not Found", { status: 404 });
  },
});

startQueueProcessor();

console.log(`[Worker] Code execution service running on port ${server.port}`);
console.log(`[Worker] Endpoints:`);
console.log(`  POST /api/worker/enqueue - Add submission to queue`);
console.log(`  GET  /api/worker/health  - Health check`);

// -----------------------------------------------------------------------------
// Graceful shutdown
// -----------------------------------------------------------------------------

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[Worker] Received ${signal}, shutting down gracefully...`);

  const currentJob = getCurrentJob();
  if (currentJob) {
    console.log(
      `[Worker] Waiting for current job (${currentJob.submissionId}) to finish...`,
    );

    await new Promise<void>((resolve) => {
      const checkDone = setInterval(() => {
        if (!isQueueProcessing()) {
          clearInterval(checkDone);
          resolve();
        }
      }, 100);
    });

    console.log("[Worker] Current job finished");
  }

  server.stop();
  console.log("[Worker] Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
