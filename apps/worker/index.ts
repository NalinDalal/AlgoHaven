import { serve } from "bun";
import { runCode } from "./docker";
import { worker } from "@algohaven/logger";
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

worker.info({ port: server.port }, "Code execution service running");
worker.info(
  "Endpoints: POST /api/worker/enqueue - Add submission to queue, GET /api/worker/health - Health check",
);

// -----------------------------------------------------------------------------
// Graceful shutdown
// -----------------------------------------------------------------------------

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  worker.info({ signal }, "Shutting down gracefully");

  const currentJob = getCurrentJob();
  if (currentJob) {
    worker.info(
      { submissionId: currentJob.submissionId },
      "Waiting for current job to finish",
    );

    await new Promise<void>((resolve) => {
      const checkDone = setInterval(() => {
        if (!isQueueProcessing()) {
          clearInterval(checkDone);
          resolve();
        }
      }, 100);
    });

    worker.info("Current job finished");
  }

  server.stop();
  worker.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
