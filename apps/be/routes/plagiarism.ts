import { prisma } from "@/packages/db";
import { requireAdmin } from "./auth";
import { success, failure } from "@/packages/utils/response";

// POST /api/plagiarism/:id/confirm - Admin confirms plagiarism
export async function handleConfirmPlagiarism(req: Request): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;
  const admin = authResult.user;

  const reportId = (req as any).params?.id as string | undefined;
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

  return success("Plagiarism confirmed", {
    userId: violatorId,
    warnings: newWarnings,
    banned: shouldBan,
    action: shouldBan ? "banned" : "warning",
  });
}
