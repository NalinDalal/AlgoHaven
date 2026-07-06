import { prisma, SubmissionStatus } from "@algohaven/db";
import { requireAuth } from "./auth";
import { success, failure } from "@algohaven/utils";
import { handleLeaderboardUpdate } from "./contest";
import { be } from "@algohaven/logger";
import { sendToWorker } from "./worker";

interface SubmitBody {
  code?: string;
  language?: string;
}

// POST /api/problems/:id/run - Run code against sample test cases only (no submission)
export async function handleRunSolution(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  const url = new URL(req.url);
  const idMatch = url.pathname.match(/\/api\/problems\/(.+)\/run/);
  const problemId = idMatch ? idMatch[1] : null;
  if (!problemId) return failure("Invalid problem id", null, 400);

  const body = (await req.json()) as SubmitBody;
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

  // Send only first 3 test cases to worker (quick check)
  const testCases = problem.testCases.slice(0, 3).map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput,
  }));

  const enqueued = await sendToWorker(runId, code, language, testCases);

  if (!enqueued) {
    be.error({ problemId, userId: authResult.user.id }, "Failed to enqueue run");
    return failure("Failed to enqueue for execution", null, 500);
  }

  be.info({ runId, problemId, userId: authResult.user.id, language, testCaseCount: testCases.length }, "Run initiated");
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

  const body = (await req.json()) as SubmitBody;
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
      status: SubmissionStatus.QUEUED,
    },
  });

  const testCases = problem.testCases.map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput,
  }));

  await sendToWorker(submission.id, code, language, testCases);

  be.info({ submissionId: submission.id, problemId, userId: user.id, language, testCaseCount: testCases.length }, "Submission created");
  return success(
    "Submission created",
    { submission_id: submission.id, status: SubmissionStatus.QUEUED },
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
interface WorkerUpdateBody {
  submissionId?: string;
  status?: string;
  points?: number;
  executionTimeMs?: number;
  memoryUsedKb?: number;
}

export async function handleWorkerUpdateSubmission(
  req: Request,
): Promise<Response> {
  const workerSecret = req.headers.get("x-worker-secret");
  if (workerSecret !== process.env.WORKER_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as WorkerUpdateBody;
  const { submissionId, status, points, executionTimeMs, memoryUsedKb } = body;

  if (!submissionId || !status) {
    return failure("submissionId and status required", null, 400);
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: status as SubmissionStatus,
      points: points ?? 0,
      executionTimeMs,
      memoryUsedKb,
    },
  });

  be.info({ submissionId, status, executionTimeMs }, "Submission updated by worker");

  if (status === SubmissionStatus.ACCEPTED) {
    try {
      await handleLeaderboardUpdate(submissionId);
    } catch (err) {
      be.error({ err, submissionId }, "Leaderboard update failed");
    }
  }

  return success("Submission updated", { submissionId, status });
}

// POST /api/worker/update-plagiarism - Worker reports plagiarism matches
interface PlagiarismReport {
  submissionId: string;
  matchedWithId: string;
}

interface PlagiarismBody {
  contestId?: string;
  reports?: PlagiarismReport[];
}

export async function handleWorkerUpdatePlagiarism(
  req: Request,
): Promise<Response> {
  const workerSecret = req.headers.get("x-worker-secret");
  if (workerSecret !== process.env.WORKER_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as PlagiarismBody;
  const { contestId, reports } = body;

  if (!contestId || !reports || reports.length === 0) {
    return failure("contestId and reports required", null, 400);
  }

  await prisma.plagiarismReport.createMany({
    data: reports.map((r) => ({
      submissionId: r.submissionId,
      matchedWithId: r.matchedWithId,
      similarityScore: 100,
      status: "PENDING",
    })),
  });

  be.info({ contestId, reportCount: reports.length }, "Plagiarism reports created");
  return success("Plagiarism reports created", { count: reports.length });
}
