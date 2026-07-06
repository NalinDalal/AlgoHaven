import { prisma, SubmissionStatus } from "@algohaven/db";
import { success, failure } from "@algohaven/utils";
import { getRankTier, BADGES, type BadgeStats } from "@algohaven/utils";
import { getUsernameParams } from "@algohaven/utils";

export async function handleGetProfile(req: Request): Promise<Response> {
  const { username } = getUsernameParams(req);
  if (!username) return failure("Username required", null, 400);

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return failure("User not found", null, 404);

  const [submissions, ratingHistoryRaw, solvedProblemsData, contestStats] =
    await Promise.all([
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
          problem: {
            select: {
              id: true,
              title: true,
              slug: true,
              difficulty: true,
            },
          },
        },
      }),

      prisma.userRating.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: {
          ratingBefore: true,
          ratingAfter: true,
          rank: true,
          createdAt: true,
          contest: { select: { title: true, slug: true } },
        },
      }),

      prisma.submission.findMany({
        where: { userId: user.id, status: SubmissionStatus.ACCEPTED },
        distinct: ["problemId"],
        select: { problem: { select: { difficulty: true, tags: true } } },
      }),

      prisma.leaderboardEntry.findMany({
        where: { userId: user.id },
        select: { rank: true, contest: { select: { isRated: true } } },
      }),
    ]);

  const currentRating =
    ratingHistoryRaw.length > 0
      ? ratingHistoryRaw[ratingHistoryRaw.length - 1].ratingAfter
      : null;
  const maxRating =
    ratingHistoryRaw.length > 0
      ? Math.max(...ratingHistoryRaw.map((r) => r.ratingAfter ?? 0))
      : null;
  const ratingDelta =
    ratingHistoryRaw.length > 0
      ? (ratingHistoryRaw[ratingHistoryRaw.length - 1].ratingAfter ?? 0) -
        (ratingHistoryRaw[0].ratingBefore ?? 0)
      : 0;
  const rankTier = getRankTier(currentRating);

  const acceptedCount = submissions.filter(
    (s) => s.status === SubmissionStatus.ACCEPTED,
  ).length;
  const totalSubmissions = await prisma.submission.count({
    where: { userId: user.id },
  });
  const acceptanceRate =
    totalSubmissions > 0
      ? Math.round((acceptedCount / totalSubmissions) * 100)
      : 0;

  const difficultyBreakdown = {
    EASY: solvedProblemsData.filter((s) => s.problem?.difficulty === "EASY")
      .length,
    MEDIUM: solvedProblemsData.filter((s) => s.problem?.difficulty === "MEDIUM")
      .length,
    HARD: solvedProblemsData.filter((s) => s.problem?.difficulty === "HARD")
      .length,
  };

  const tagsMap: Record<string, number> = {};
  for (const s of solvedProblemsData) {
    if (s.problem?.tags) {
      for (const tag of s.problem.tags) {
        tagsMap[tag] = (tagsMap[tag] ?? 0) + 1;
      }
    }
  }
  const topTags = Object.entries(tagsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const ratedContests = contestStats.filter((c) => c.contest?.isRated);
  const bestRank =
    ratedContests.length > 0
      ? Math.min(...ratedContests.map((c) => c.rank ?? 0).filter((rank) => rank > 0))
      : null;
  const avgRank =
    ratedContests.length > 0
      ? Math.round(
          ratedContests.reduce((a, c) => a + (c.rank ?? 0), 0) / ratedContests.length,
        )
      : null;
  const totalWins = ratedContests.filter((c) => c.rank === 1).length;

  const solvedCount = solvedProblemsData.length;
  const contestsEntered = contestStats.length;

  const stats: BadgeStats = {
    totalSubmissions,
    acceptedCount,
    solvedCount,
    difficultyBreakdown,
    streak: { current: 0, longest: 0 },
    contestsEntered,
    ratingDelta,
  };

  const earnedBadges = BADGES.filter((b) => b.condition(stats)).map((b) => ({
    id: b.id,
    name: b.name,
    desc: b.desc,
    icon: b.icon,
  }));

  return success("User profile retrieved", {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,

    currentRating,
    maxRating,
    ratingDelta,
    rankTier: rankTier.tier,
    rankColor: rankTier.color,
    rankBg: rankTier.bg,

    totalSubmissions,
    acceptedCount,
    acceptanceRate,
    solvedCount,
    difficultyBreakdown,
    topTags,
    contestsEntered,

    contestPerformance: {
      totalRated: ratedContests.length,
      bestRank,
      avgRank,
      totalWins,
    },

    badges: earnedBadges,

    recentSubmissions: submissions.map((s) => ({
      id: s.id,
      status: s.status,
      language: s.language,
      executionTimeMs: s.executionTimeMs,
      memoryUsedKb: s.memoryUsedKb,
      createdAt: s.createdAt,
      problem: s.problem,
    })),

    ratingHistory: ratingHistoryRaw.map((r) => ({
      contestTitle: r.contest?.title ?? "Unknown contest",
      contestSlug: r.contest?.slug ?? "",
      ratingBefore: r.ratingBefore ?? 0,
      ratingAfter: r.ratingAfter ?? 0,
      delta: (r.ratingAfter ?? 0) - (r.ratingBefore ?? 0),
      rank: r.rank ?? 0,
      createdAt: r.createdAt,
    })),
  });
}
