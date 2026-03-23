import { prisma } from "@/packages/db";
import { requireAuth } from "./auth";
import { success, failure } from "@/packages/utils/response";

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        code,
        language,
        testCases,
      }),
    });
    return res.ok;
  } catch (error) {
    console.error("[Worker] Failed to enqueue:", error);
    return false;
  }
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

  return success("Submission updated", { submissionId, status });
}
