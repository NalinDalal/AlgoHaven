import { serve } from "bun";
import { Worker, type Job } from "bullmq";
import { runCode } from "./docker";
import { checkContestPlagiarism } from "./plagiarism";
import { worker } from "@algohaven/logger";
import { validateEnv } from "@algohaven/utils";
import {
  enqueueSubmission,
  getQueueLength,
  getActiveJob,
  submissionQueue,
  scheduleRatingCalculation,
  type JobData,
  type CompletedJob,
  type RatingJobData,
} from "./queue";
import { handleEnqueue, handleHealth } from "./api";

interface ScheduleRatingBody {
  contestId?: string;
  endTime?: string;
}

// The worker must be started with the backend URL and shared worker secret
// from the root .env so it can authenticate its callbacks.
validateEnv(
  {
    BACKEND_URL: { required: true },
    WORKER_SECRET: { required: true },
    REDIS_HOST: { required: false, default: "localhost" },
    REDIS_PORT: { required: false, default: "6379" },
  },
  "Worker",
);

const BACKEND_URL = process.env.BACKEND_URL!;
const WORKER_SECRET = process.env.WORKER_SECRET!;

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

async function callCalculateRatings(contestId: string): Promise<void> {
  const res = await fetch(
    `${BACKEND_URL}/api/contest/${contestId}/calculate-ratings`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret": WORKER_SECRET,
      },
    },
  );
  if (!res.ok) {
    throw new Error(`Rating calculation failed: ${res.status}`);
  }
}

const server = serve({
  port: 3002,
  fetch(req: Request) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/api/worker/enqueue") {
      return handleEnqueue(req, WORKER_SECRET, async (jobData) => {
        const jobId = await enqueueSubmission(jobData as JobData);
        return jobId;
      });
    }

    if (req.method === "POST" && url.pathname === "/api/worker/schedule-rating") {
      return handleEnqueue(req, WORKER_SECRET, async (body) => {
        const { contestId, endTime } = body as ScheduleRatingBody;
        if (!contestId || !endTime) {
          throw new Error("contestId and endTime are required");
        }
        const jobId = await scheduleRatingCalculation(contestId, new Date(endTime));
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
  async (job: Job<JobData, CompletedJob>) => {
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

    return { id: job.id!, submissionId, status: finalStatus, executionTimeMs: totalTime };
  },
  { connection },
);

myWorker.on("completed", (job: Job<JobData, CompletedJob>) => {
  worker.info({ jobId: job.id }, "Job completed");
});

myWorker.on("failed", (job: Job<JobData, CompletedJob> | undefined, err: Error) => {
  worker.error({ jobId: job?.id, err: err.message }, "Job failed");
});

worker.info("BullMQ worker started");

// -----------------------------------------------------------------------------
// Rating Worker
// -----------------------------------------------------------------------------

const ratingWorker = new Worker<RatingJobData>(
  "ratings",
  async (job: Job<RatingJobData>) => {
    const { contestId } = job.data;
    worker.info({ contestId }, "Processing rating calculation");
    await callCalculateRatings(contestId);
    worker.info({ contestId }, "Rating calculation complete, checking plagiarism");
    try {
      await checkContestPlagiarism(contestId);
    } catch (err) {
      worker.error({ contestId, err }, "Plagiarism check failed");
    }
  },
  { connection },
);

ratingWorker.on("completed", (job) => {
  worker.info({ jobId: job.id, contestId: job.data.contestId }, "Rating job completed");
});

ratingWorker.on("failed", (job, err) => {
  worker.error({ jobId: job?.id, err: err.message }, "Rating job failed");
});

worker.info("BullMQ rating worker started");

// -----------------------------------------------------------------------------
// Graceful shutdown
// -----------------------------------------------------------------------------

async function shutdown(signal: string) {
  worker.info({ signal }, "Shutting down gracefully");

  await myWorker.close();
  await ratingWorker.close();

  server.stop();
  worker.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
