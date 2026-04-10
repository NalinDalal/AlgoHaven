import { serve } from "bun";
import { runCode } from "./docker";
import { worker } from "@algohaven/logger";
import {
  enqueueSubmission,
  getQueueLength,
  getActiveJob,
  submissionQueue,
  type JobData,
  type CompletedJob,
} from "./queue";
import { handleEnqueue, handleHealth } from "./api";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const WORKER_SECRET = process.env.WORKER_SECRET || "dev-secret-change-in-prod";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

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

const server = serve({
  port: 3002,
  fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/api/worker/enqueue") {
      return handleEnqueue(req, WORKER_SECRET, async (jobData) => {
        const jobId = await enqueueSubmission(jobData as JobData);
        return jobId;
      });
    }

    if (req.method === "GET" && url.pathname === "/api/worker/health") {
      return handleHealth(async () => getQueueLength())();
    }

    return new Response("Not Found", { status: 404 });
  },
});

worker.info({ port: server.port }, "Code execution service running");
worker.info(
  "Endpoints: POST /api/worker/enqueue - Add submission to queue, GET /api/worker/health - Health check",
);

// -----------------------------------------------------------------------------
// BullMQ Worker
// -----------------------------------------------------------------------------

const myWorker = new Worker<JobData, CompletedJob>(
  "submissions",
  async (job) => {
    const { submissionId, code, language, testCases } = job.data;

    worker.info(
      {
        submissionId,
        language,
        testCases: testCases.length,
      },
      "Processing submission",
    );

    let allAccepted = true;
    let totalTime = 0;

    for (const testCase of testCases) {
      const result = await runCode(code, testCase.input, language);
      totalTime += result.executionTimeMs;

      const actual = result.stdout.trim();
      const expected = testCase.expectedOutput.trim();

      if (result.status === "TLE") {
        worker.warn({ submissionId }, "Test case TLE");
        allAccepted = false;
      } else if (result.status === "RUNTIME_ERROR") {
        worker.warn(
          { submissionId, stderr: result.stderr },
          "Test case RUNTIME_ERROR",
        );
        allAccepted = false;
      } else if (actual === expected) {
        worker.debug({ submissionId }, "Test case ACCEPTED");
      } else {
        worker.warn(
          { submissionId, expected, actual },
          "Test case WRONG_ANSWER",
        );
        allAccepted = false;
      }
    }

    const finalStatus = allAccepted ? "ACCEPTED" : "WRONG_ANSWER";
    worker.info(
      {
        submissionId,
        status: finalStatus,
        totalTimeMs: totalTime,
      },
      "Submission final result",
    );

    await updateSubmission(submissionId, finalStatus, totalTime);

    return { status: finalStatus, executionTimeMs: totalTime };
  },
  { connection },
);

myWorker.on("completed", (job) => {
  worker.info({ jobId: job.id }, "Job completed");
});

myWorker.on("failed", (job, err) => {
  worker.error({ jobId: job.id, err: err.message }, "Job failed");
});

worker.info("BullMQ worker started");

// -----------------------------------------------------------------------------
// Graceful shutdown
// -----------------------------------------------------------------------------

async function shutdown(signal: string) {
  worker.info({ signal }, "Shutting down gracefully");

  await myWorker.close();

  server.stop();
  worker.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
