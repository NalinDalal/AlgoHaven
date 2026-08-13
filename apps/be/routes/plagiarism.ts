import { prisma, PlagiarismStatus } from "@algohaven/db";
import { requireAdmin } from "./auth";
import { success, failure, getIdParams } from "@algohaven/utils";
import { be } from "@algohaven/logger";

// GET /api/admin/plagiarism - Admin lists plagiarism reports (paginated)
export async function handleListPlagiarismReports(
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
  const status = url.searchParams.get("status");
  const skip = (page - 1) * limit;

  const where = status
    ? { status: status as PlagiarismStatus }
    : {};

  const [reports, total] = await Promise.all([
    prisma.plagiarismReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        submission: {
          select: {
            id: true,
            language: true,
            createdAt: true,
            user: { select: { id: true, username: true, email: true } },
            problem: { select: { id: true, title: true, slug: true } },
          },
        },
        reviewedBy: { select: { id: true, username: true, email: true } },
      },
    }),
    prisma.plagiarismReport.count({ where }),
  ]);

  // Resolve matched-with submissions for usernames
  const matchedIds = reports
    .map((r) => r.matchedWithId)
    .filter((id): id is string => Boolean(id));
  const matched = matchedIds.length
    ? await prisma.submission.findMany({
        where: { id: { in: matchedIds } },
        select: {
          id: true,
          user: { select: { id: true, username: true, email: true } },
        },
      })
    : [];
  const matchedById = new Map(matched.map((m) => [m.id, m.user]));

  return success("Plagiarism reports retrieved", {
    reports: reports.map(({ matchedWithId, ...r }) => ({
      ...r,
      matchedWithUser: matchedWithId ? (matchedById.get(matchedWithId) ?? null) : null,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/plagiarism/:id/confirm - Admin confirms plagiarism
export async function handleConfirmPlagiarism(req: Request): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;
  const admin = authResult.user;

  const { id: reportId } = getIdParams(req);
  if (!reportId) return failure("Missing report id", null, 400);

  const report = await prisma.plagiarismReport.findUnique({
    where: { id: reportId },
    include: { submission: { select: { userId: true } } },
  });
  if (!report) return failure("Report not found", null, 404);

  if (report.status !== "PENDING") {
    return failure("Report has already been reviewed", null, 400);
  }

  const violatorId = report.submission.userId;
  const user = await prisma.user.findUnique({ where: { id: violatorId } });
  if (!user) return failure("User not found", null, 404);

  const newWarnings = user.warnings + 1;
  const shouldBan = newWarnings >= 2;

  await prisma.$transaction([
    prisma.plagiarismReport.update({
      where: { id: reportId },
      data: {
        status: "CONFIRMED",
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: violatorId },
      data: {
        warnings: newWarnings,
        ...(shouldBan ? { banned: true, bannedAt: new Date() } : {}),
      },
    }),
  ]);

  be.info({ reportId, violatorId, warnings: newWarnings, banned: shouldBan, adminId: admin.id }, "Plagiarism confirmed");
  return success("Plagiarism confirmed", {
    userId: violatorId,
    warnings: newWarnings,
    banned: shouldBan,
    action: shouldBan ? "banned" : "warning",
  });
}
