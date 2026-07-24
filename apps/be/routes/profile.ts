import { prisma, SubmissionStatus } from "@algohaven/db";
import { success, failure } from "@algohaven/utils";
import { getRankTier, BADGES, type BadgeStats } from "@algohaven/utils";
import { getUsernameParams } from "@algohaven/utils";

function calculateStreak(submissionDates: Date[]): {
  current: number;
  longest: number;
} {
  if (submissionDates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...submissionDates].sort((a, b) => b.getTime() - a.getTime());
  const uniqueDays = [
    ...new Set(sorted.map((d) => d.toISOString().split("T")[0])),
  ];

  let current = 0;
  let longest = 0;
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];

  for (let i = 0; i < uniqueDays.length; i++) {
    const day = uniqueDays[i];
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    const expected = expectedDate.toISOString().split("T")[0];

    if (day === expected || (i === 0 && day === today)) {
      streak++;
      if (i === 0) current = streak;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
      if (i === 0) current = 1;
    }
  }
  longest = Math.max(longest, streak);

  return { current, longest };
}

export async function handleGetProfile(req: Request): Promise<Response> {
  const { username } = getUsernameParams(req);
  if (!username) return failure("Username required", null, 400);

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return failure("User not found", null, 404);

  const [submissions, allSubmissionDates, ratingHistoryRaw, solvedProblemsData, contestStats] =
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

      prisma.submission.findMany({
        where: { userId: user.id },
        select: { createdAt: true, status: true },
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
  const ratedRanks = ratedContests
    .map((c) => c.rank)
    .filter((rank): rank is number => rank !== null);
  const bestRank = ratedRanks.length > 0 ? Math.min(...ratedRanks) : null;
  const avgRank =
    ratedRanks.length > 0
      ? Math.round(ratedRanks.reduce((a, rank) => a + rank, 0) / ratedRanks.length)
      : null;
  const totalWins = ratedContests.filter((c) => c.rank === 1).length;

  const solvedCount = solvedProblemsData.length;
  const contestsEntered = contestStats.length;

  const submissionDates = allSubmissionDates.map((s) => new Date(s.createdAt));
  const streak = calculateStreak(submissionDates);

  const heatmap: Record<string, { count: number; accepted: number }> = {};
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  for (const sub of allSubmissionDates) {
    const date = sub.createdAt.toISOString().split("T")[0];
    if (!heatmap[date]) heatmap[date] = { count: 0, accepted: 0 };
    heatmap[date].count++;
    if (sub.status === SubmissionStatus.ACCEPTED) heatmap[date].accepted++;
  }

  const stats: BadgeStats = {
    totalSubmissions,
    acceptedCount,
    solvedCount,
    difficultyBreakdown,
    streak,
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

    streak,

    heatmap,

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
