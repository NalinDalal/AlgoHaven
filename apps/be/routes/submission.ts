import { prisma } from "@/packages/db";
import { requireAuth } from "./auth";
import { success, failure } from "@/packages/utils/response";

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

  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      problemId,
      code,
      language,
      status: "QUEUED",
    },
  });

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
