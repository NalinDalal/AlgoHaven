import { prisma, SubmissionStatus, JudgePhase } from "@algohaven/db";
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
// Admin only - create a single-submission rejudge via RejudgeJob
export async function handleAdminRejudgeSubmission(
  req: Request,
): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const { id: submissionId } = getIdParams(req);
  if (!submissionId) return failure("Invalid submission id", null, 400);

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, problemId: true, contestId: true },
  });

  if (!submission) return failure("Submission not found", null, 404);

  const job = await prisma.rejudgeJob.create({
    data: {
      problemId: submission.problemId,
      contestId: submission.contestId ?? undefined,
      submissionId,
      triggeredById: authResult.user.id,
      status: "PENDING",
      totalCount: 1,
    },
  });

  be.info({ jobId: job.id, submissionId, adminId: authResult.user.id }, "Single-submission rejudge job created");

  processRejudgeJob(job.id).catch((err) => {
    be.error({ jobId: job.id, error: err instanceof Error ? err.message : "Unknown error" }, "Rejudge job processing failed");
  });

  return success("Rejudge job created", {
    jobId: job.id,
    submissionId,
    totalCount: 1,
  });
}

// POST /api/admin/problems/:id/rejudge
// Admin only - create a bulk rejudge job for all submissions of a problem
export async function handleAdminBulkRejudge(
  req: Request,
): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const url = new URL(req.url);
  const idMatch = url.pathname.match(/\/api\/admin\/problems\/(.+)\/rejudge/);
  const problemId = idMatch ? idMatch[1] : null;
  if (!problemId) return failure("Invalid problem id", null, 400);

  const body = (await req.json().catch(() => ({}))) as { contestId?: string };
  const contestId = body.contestId ?? null;

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { id: true, title: true },
  });
  if (!problem) return failure("Problem not found", null, 404);

  // Count submissions to rejudge
  const where: Record<string, unknown> = { problemId };
  if (contestId) where.contestId = contestId;

  const totalCount = await prisma.submission.count({ where });

  if (totalCount === 0) {
    return failure("No submissions found to rejudge", null, 400);
  }

  const job = await prisma.rejudgeJob.create({
    data: {
      problemId,
      contestId,
      triggeredById: authResult.user.id,
      status: "PENDING",
      totalCount,
    },
  });

  be.info(
    { jobId: job.id, problemId, contestId, totalCount, adminId: authResult.user.id },
    "Bulk rejudge job created",
  );

  // Start processing in background (non-blocking)
  processRejudgeJob(job.id).catch((err) => {
    be.error({ jobId: job.id, error: err instanceof Error ? err.message : "Unknown error" }, "Rejudge job processing failed");
  });

  return success("Rejudge job created", {
    jobId: job.id,
    problemId,
    contestId,
    totalCount,
  });
}

// GET /api/admin/rejudge-jobs
// Admin only - list recent rejudge jobs with progress
export async function handleAdminListRejudgeJobs(
  req: Request,
): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10)));
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.rejudgeJob.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        problemId: true,
        contestId: true,
        status: true,
        totalCount: true,
        doneCount: true,
        errorLog: true,
        createdAt: true,
        updatedAt: true,
        triggeredBy: {
          select: { id: true, username: true, email: true },
        },
      },
    }),
    prisma.rejudgeJob.count(),
  ]);

  return success("Rejudge jobs retrieved", {
    jobs,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// Background processor for bulk rejudge jobs
async function processRejudgeJob(jobId: string): Promise<void> {
  // Mark as RUNNING
  await prisma.rejudgeJob.update({
    where: { id: jobId },
    data: { status: "RUNNING" },
  });

  const job = await prisma.rejudgeJob.findUnique({
    where: { id: jobId },
    select: { problemId: true, contestId: true, submissionId: true },
  });

  if (!job) {
    await prisma.rejudgeJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorLog: "Job record not found" },
    });
    return;
  }

  let submissions: { id: string; code: string; language: string; judgePhase: string; problemId: string }[];

  if (job.submissionId) {
    const sub = await prisma.submission.findUnique({
      where: { id: job.submissionId },
      select: { id: true, code: true, language: true, judgePhase: true, problemId: true },
    });
    submissions = sub ? [sub] : [];
  } else {
    const where: Record<string, unknown> = { problemId: job.problemId };
    if (job.contestId) where.contestId = job.contestId;

    submissions = await prisma.submission.findMany({
      where,
      select: { id: true, code: true, language: true, judgePhase: true, problemId: true },
    });
  }

  if (submissions.length === 0) {
    await prisma.rejudgeJob.update({
      where: { id: jobId },
      data: { status: "DONE", doneCount: 0, errorLog: "No submissions matched" },
    });
    return;
  }

  // Fetch test cases and checker info for the problem
  const problem = await prisma.problem.findUnique({
    where: { id: job.problemId },
    select: {
      testCases: { select: { input: true, expectedOutput: true } },
      hasCustomChecker: true,
      checkerCode: true,
    },
  });

  if (!problem) {
    await prisma.rejudgeJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorLog: "Problem not found" },
    });
    return;
  }

  const testCases = problem.testCases.map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput,
  }));

  let doneCount = 0;
  const errors: string[] = [];

  for (const sub of submissions) {
    try {
      // Reset submission to QUEUED
      await prisma.submission.update({
        where: { id: sub.id },
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
      const enqueued = await sendToWorker(
        sub.id,
        sub.code,
        sub.language,
        testCases,
        sub.judgePhase,
        problem.hasCustomChecker,
        problem.checkerCode ?? undefined,
      );

      if (!enqueued) {
        errors.push(`Failed to enqueue submission ${sub.id}`);
      }

      doneCount++;
      await prisma.rejudgeJob.update({
        where: { id: jobId },
        data: { doneCount },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Submission ${sub.id}: ${msg}`);
      doneCount++;
      await prisma.rejudgeJob.update({
        where: { id: jobId },
        data: { doneCount },
      });
    }
  }

  // Mark as DONE (or FAILED if all errored)
  const finalStatus = errors.length === submissions.length ? "FAILED" : "DONE";
  await prisma.rejudgeJob.update({
    where: { id: jobId },
    data: {
      status: finalStatus,
      errorLog: errors.length > 0 ? errors.join("\n") : null,
    },
  });

  be.info(
    { jobId, total: submissions.length, doneCount, errors: errors.length },
    "Rejudge job completed",
  );
}
