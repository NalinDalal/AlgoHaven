import { prisma } from "@/packages/db";
import { requireAuth } from "./auth";
import { success, failure } from "@/packages/utils/response";
import { handleLeaderboardUpdate } from "./contest";
import { be } from "@algohaven/logger";

type SubmissionStatus =
  | "QUEUED"
  | "RUNNING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TLE"
  | "MLE"
  | "RUNTIME_ERROR"
  | "COMPILE_ERROR";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:3002";

async function sendToWorker(
  submissionId: string,
  code: string,
  language: string,
  testCases: { input: string; expectedOutput: string }[],
) {
  try {
    const res = await fetch(`${WORKER_URL}/api/worker/enqueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret":
          process.env.WORKER_SECRET || "dev-secret-change-in-prod",
      },
      body: JSON.stringify({
        submissionId,
        code,
        language,
        testCases,
      }),
    });
    return res.ok;
  } catch (error) {
    be.error({ err: error }, "Failed to enqueue worker");
    return false;
  }
}

// POST /api/problems/:id/run - Run code against sample test cases only (no submission)
export async function handleRunSolution(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  const url = new URL(req.url);
  const idMatch = url.pathname.match(/\/api\/problems\/(.+)\/run/);
  const problemId = idMatch ? idMatch[1] : null;
  if (!problemId) return failure("Invalid problem id", null, 400);

  const body = (await req.json()) as any;
  const { code, language } = body ?? {};

  if (!code || !language) {
    return failure("Code and language are required", null, 422);
  }

  // Get ONLY sample test cases for running
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { testCases: { where: { isSample: true } } },
  });

  if (!problem) {
    return failure("Problem not found", null, 404);
  }

  if (problem.testCases.length === 0) {
    return failure("No sample test cases available", null, 400);
  }

  // Create a temporary run ID (not stored in DB)
  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Send only sample test cases to worker
  const testCases = problem.testCases.map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput,
  }));

  const enqueued = await sendToWorker(runId, code, language, testCases);

  if (!enqueued) {
    return failure("Failed to enqueue for execution", null, 500);
  }

  return success(
    "Run initiated",
    { runId, testCaseCount: testCases.length },
    202,
  );
}

export async function handleSubmitSolution(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const url = new URL(req.url);
  const idMatch = url.pathname.match(/\/api\/problems\/(.+)\/submission/);
  const problemId = idMatch ? idMatch[1] : null;
  if (!problemId) return failure("Invalid problem id", null, 400);

  const body = (await req.json()) as any;
  const { code, language } = body ?? {};

  if (!code || !language) {
    return failure("Code and language are required", null, 422);
  }

  // Get test cases for the problem
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { testCases: true },
  });

  if (!problem) {
    return failure("Problem not found", null, 404);
  }

  if (problem.testCases.length > 200) {
    //return top 3 test cases
    const testCases = problem.testCases.slice(0, 3);
    return success("submission created", { testCases }, 201);
  }

  // Create submission
  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      problemId,
      code,
      language,
      status: "QUEUED",
    },
  });

  // Send to worker queue
  const testCases = problem.testCases.map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput,
  }));

  await sendToWorker(submission.id, code, language, testCases);

  return success(
    "Submission created",
    { submission_id: submission.id, status: "QUEUED" },
    201,
  );
}

export async function handleSubmissionStatus(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const idMatch = url.pathname.match(/\/api\/submissions\/(.+)\/status/);
  const submissionId = idMatch ? idMatch[1] : null;
  if (!submissionId) return failure("Invalid submission id", null, 400);

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { problem: true },
  });

  if (!submission) return failure("Submission not found", null, 404);

  return success("Submission status retrieved", {
    status: submission.status,
    points: submission.points,
    executionTimeMs: submission.executionTimeMs,
    memoryUsedKb: submission.memoryUsedKb,
  });
}

// POST /api/worker/update-submission - Worker calls this to update status
export async function handleWorkerUpdateSubmission(
  req: Request,
): Promise<Response> {
  const workerSecret = req.headers.get("x-worker-secret");
  if (workerSecret !== process.env.WORKER_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as {
    submissionId?: string;
    status?: string;
    points?: number;
    executionTimeMs?: number;
    memoryUsedKb?: number;
  };
  const { submissionId, status, points, executionTimeMs, memoryUsedKb } = body;

  if (!submissionId || !status) {
    return failure("submissionId and status required", null, 400);
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: status as any,
      points: points ?? 0,
      executionTimeMs,
      memoryUsedKb,
    },
  });

  if (status === "ACCEPTED") {
    try {
      await handleLeaderboardUpdate(submissionId);
    } catch (err) {
      be.error({ err }, "Leaderboard update failed");
    }
  }

  return success("Submission updated", { submissionId, status });
}
