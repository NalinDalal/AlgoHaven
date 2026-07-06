import { prisma, SubmissionStatus } from "@algohaven/db";
import { requireAdmin } from "./auth";
import { success, failure, getIdParams } from "@algohaven/utils";
import { sendToWorker } from "./worker";
import { be } from "@algohaven/logger";

// GET /api/admin/submissions
// Admin only - list all submissions with pagination and filters
export async function handleAdminListSubmissions(
  req: Request,
): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)),
  );
  const status = url.searchParams.get("status") as SubmissionStatus | null;
  const userId = url.searchParams.get("userId");
  const problemId = url.searchParams.get("problemId");
  const search = url.searchParams.get("search");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (problemId) where.problemId = problemId;

  if (search) {
    where.OR = [
      { user: { username: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { problem: { title: { contains: search, mode: "insensitive" } } },
      { problem: { slug: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        language: true,
        points: true,
        executionTimeMs: true,
        createdAt: true,
        user: {
          select: { id: true, username: true, email: true },
        },
        problem: {
          select: { id: true, title: true, slug: true, difficulty: true },
        },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return success("Submissions retrieved", {
    submissions,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/admin/submissions/:id/rejudge
// Admin only - rejudge a single submission by resending it to the worker
export async function handleAdminRejudgeSubmission(
  req: Request,
): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const { id: submissionId } = getIdParams(req);
  if (!submissionId) return failure("Invalid submission id", null, 400);

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      problem: {
        include: { testCases: { select: { input: true, expectedOutput: true } } },
      },
    },
  });

  if (!submission) return failure("Submission not found", null, 404);

  // Reset submission to QUEUED
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.QUEUED,
      points: 0,
      executionTimeMs: null,
      memoryUsedKb: null,
      compilerOutput: null,
      judgeOutput: null,
    },
  });

  // Send to worker
  const testCases = submission.problem.testCases.map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput,
  }));

  const enqueued = await sendToWorker(
    submissionId,
    submission.code,
    submission.language,
    testCases,
  );

  if (!enqueued) {
    be.error({ submissionId, adminId: authResult.user.id }, "Rejudge enqueue failed");
    return failure("Failed to enqueue rejudge", null, 500);
  }

  be.info({ submissionId, adminId: authResult.user.id }, "Submission rejudged");
  return success("Submission rejudged", {
    id: submissionId,
    status: SubmissionStatus.QUEUED,
  });
}
