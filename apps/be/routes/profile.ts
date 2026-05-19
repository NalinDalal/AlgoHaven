import { prisma, SubmissionStatus } from "@/packages/db";
import { success, failure } from "@/packages/utils/response";

function getRankTier(rating: number | null): {
  tier: string;
  color: string;
  bg: string;
} {
  if (rating === null)
    return { tier: "Unrated", color: "#888888", bg: "#88888815" };
  if (rating < 1200)
    return { tier: "Newbie", color: "#808080", bg: "#80808015" };
  if (rating < 1400)
    return { tier: "Pupil", color: "#008000", bg: "#00800015" };
  if (rating < 1600)
    return { tier: "Specialist", color: "#03a89e", bg: "#03a89e15" };
  if (rating < 1900)
    return { tier: "Expert", color: "#0000ff", bg: "#0000ff15" };
  if (rating < 2100)
    return { tier: "Candidate Master", color: "#aa00aa", bg: "#aa00aa15" };
  if (rating < 2300)
    return { tier: "Master", color: "#ff8c00", bg: "#ff8c0015" };
  if (rating < 2400)
    return { tier: "International Master", color: "#ff8c00", bg: "#ff8c0015" };
  if (rating < 2600)
    return { tier: "Grandmaster", color: "#ff0000", bg: "#ff000015" };
  if (rating < 3000)
    return {
      tier: "International Grandmaster",
      color: "#ff0000",
      bg: "#ff000015",
    };
  return { tier: "Legendary Grandmaster", color: "#ff0000", bg: "#ff000015" };
}

const BADGES = [
  {
    id: "first_submission",
    name: "First Steps",
    desc: "Submit your first solution",
    icon: "🚀",
    condition: (s: any) => s.totalSubmissions >= 1,
  },
  {
    id: "ten_submissions",
    name: "Getting Started",
    desc: "Submit 10 solutions",
    icon: "📝",
    condition: (s: any) => s.totalSubmissions >= 10,
  },
  {
    id: "hundred_submissions",
    name: "Dedicated",
    desc: "Submit 100 solutions",
    icon: "💯",
    condition: (s: any) => s.totalSubmissions >= 100,
  },
  {
    id: "first_accepted",
    name: "Hello World",
    desc: "Get your first accepted",
    icon: "✅",
    condition: (s: any) => s.acceptedCount >= 1,
  },
  {
    id: "ten_solved",
    name: "Problem Solver",
    desc: "Solve 10 problems",
    icon: "🧩",
    condition: (s: any) => s.solvedCount >= 10,
  },
  {
    id: "fifty_solved",
    name: "Prolific",
    desc: "Solve 50 problems",
    icon: "🏆",
    condition: (s: any) => s.solvedCount >= 50,
  },
  {
    id: "easy_master",
    name: "Warming Up",
    desc: "Solve 20 easy problems",
    icon: "🌱",
    condition: (s: any) => s.difficultyBreakdown?.EASY >= 20,
  },
  {
    id: "medium_master",
    name: "Intermediate",
    desc: "Solve 20 medium problems",
    icon: "📈",
    condition: (s: any) => s.difficultyBreakdown?.MEDIUM >= 20,
  },
  {
    id: "hard_master",
    name: "Elite",
    desc: "Solve 20 hard problems",
    icon: "🔥",
    condition: (s: any) => s.difficultyBreakdown?.HARD >= 20,
  },
  {
    id: "streak_7",
    name: "Consistent",
    desc: "7 day submission streak",
    icon: "🔥",
    condition: (s: any) => s.streak?.current >= 7,
  },
  {
    id: "streak_30",
    name: "Dedicated",
    desc: "30 day submission streak",
    icon: "⚡",
    condition: (s: any) => s.streak?.current >= 30,
  },
  {
    id: "contestParticipant",
    name: "Competitor",
    desc: "Enter a contest",
    icon: "🏁",
    condition: (s: any) => s.contestsEntered >= 1,
  },
  {
    id: "rated_climb",
    name: "Rising Star",
    desc: "Improve rating in a contest",
    icon: "📊",
    condition: (s: any) => s.ratingDelta > 0,
  },
];

export async function handleGetProfile(req: Request): Promise<Response> {
  const { username } = (req as any).params;
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
      ? Math.min(...ratedContests.map((c) => c.rank))
      : null;
  const avgRank =
    ratedContests.length > 0
      ? Math.round(
          ratedContests.reduce((a, c) => a + c.rank, 0) / ratedContests.length,
        )
      : null;
  const totalWins = ratedContests.filter((c) => c.rank === 1).length;

  const solvedCount = solvedProblemsData.length;
  const contestsEntered = contestStats.length;

  const stats = {
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
