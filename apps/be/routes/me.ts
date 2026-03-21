import { prisma } from "@/packages/db";
import { requireAuth } from "./auth";
import { success, failure } from "@/packages/utils/response";

export async function handleMe(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const [dbUser, recentSubmissions, ratingHistory] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            submissions: true,
            leaderboardEntries: true,
          },
        },
      },
    }),

    prisma.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        language: true,
        executionTimeMs: true,
        memoryUsedKb: true,
        createdAt: true,
        contestId: true,
        problem: {
          select: { id: true, title: true, slug: true, difficulty: true },
        },
        contest: { select: { id: true, title: true, slug: true } },
      },
    }),

    prisma.userRating.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: {
        contestId: true,
        ratingBefore: true,
        ratingAfter: true,
        rank: true,
        createdAt: true,
        contest: { select: { title: true, slug: true } },
      },
    }),
  ]);

  if (!dbUser) {
    return failure("User not found", null, 404);
  }

  const currentRating = ratingHistory.at(-1)?.ratingAfter ?? null;

  function getRankTier(rating: number | null): { tier: string; color: string } {
    if (rating === null) return { tier: "Unrated", color: "#888888" };
    if (rating < 1200) return { tier: "Newbie", color: "#808080" };
    if (rating < 1400) return { tier: "Pupil", color: "#008000" };
    if (rating < 1600) return { tier: "Specialist", color: "#03a89e" };
    if (rating < 1900) return { tier: "Expert", color: "#0000ff" };
    if (rating < 2100) return { tier: "Candidate Master", color: "#aa00aa" };
    if (rating < 2300) return { tier: "Master", color: "#ff8c00" };
    if (rating < 2400)
      return { tier: "International Master", color: "#ff8c00" };
    if (rating < 2600) return { tier: "Grandmaster", color: "#ff0000" };
    if (rating < 3000)
      return { tier: "International Grandmaster", color: "#ff0000" };
    return { tier: "Legendary Grandmaster", color: "#ff0000" };
  }

  const rankTier = getRankTier(currentRating);

  const verdictCounts = await prisma.submission.groupBy({
    by: ["status"],
    where: { userId: user.id },
    _count: { status: true },
  });

  const verdictMap: Record<string, number> = {};
  for (const v of verdictCounts) {
    verdictMap[v.status] = v._count.status;
  }

  const acceptedCount = verdictMap["ACCEPTED"] ?? 0;
  const totalCount = dbUser._count.submissions ?? 0;
  const acceptanceRate =
    totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

  const solvedProblems = await prisma.submission.findMany({
    where: { userId: user.id, status: "ACCEPTED" },
    distinct: ["problemId"],
    select: { problemId: true },
  });

  const languageCounts = await prisma.submission.groupBy({
    by: ["language"],
    where: { userId: user.id },
    _count: { language: true },
    orderBy: { _count: { language: "desc" } },
  });

  return success("User profile retrieved", {
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username,
    role: dbUser.role,
    createdAt: dbUser.createdAt,
    currentRating: currentRating ?? null,
    rankTier: rankTier.tier,
    rankColor: rankTier.color,
    maxRating:
      ratingHistory.length > 0
        ? Math.max(...ratingHistory.map((r) => r.ratingAfter ?? 0))
        : null,
    totalSubmissions: totalCount,
    acceptedCount: acceptedCount,
    acceptanceRate: acceptanceRate,
    solvedCount: solvedProblems.length,
    contestsEntered: dbUser._count.leaderboardEntries ?? 0,
    verdictBreakdown: verdictMap,
    languageBreakdown: languageCounts.map((l) => ({
      language: l.language,
      count: l._count.language,
    })),
    recentSubmissions: recentSubmissions.map((s) => ({
      id: s.id,
      status: s.status,
      language: s.language,
      executionTimeMs: s.executionTimeMs,
      memoryUsedKb: s.memoryUsedKb,
      createdAt: s.createdAt,
      problem: s.problem,
      contest: s.contest ?? null,
    })),
    ratingHistory: ratingHistory.map((r) => ({
      contestId: r.contestId,
      contestTitle: r.contest?.title ?? "Unknown contest",
      contestSlug: r.contest?.slug ?? r.contestId,
      ratingBefore: r.ratingBefore ?? 0,
      ratingAfter: r.ratingAfter ?? 0,
      delta: (r.ratingAfter ?? 0) - (r.ratingBefore ?? 0),
      rank: r.rank ?? 0,
      createdAt: r.createdAt,
    })),
  });
}

export async function handleMePost(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const body = (await req.json()) as { rating?: number };
  const { rating } = body ?? {};

  if (rating === undefined || rating === null) {
    return failure("Rating must be a number", null, 400);
  }

  const ratingBefore = await prisma.userRating.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { ratingBefore: true },
  });

  if (ratingBefore?.ratingBefore === rating) {
    return failure("Rating is unchanged", null, 400);
  }

  await prisma.userRating.create({
    data: {
      userId: user.id,
      contestId: "default",
      ratingBefore: ratingBefore?.ratingBefore ?? rating,
      ratingAfter: rating,
      rank: 0,
    },
  });

  return success("Rating updated", { rating });
}
