import { prisma } from "@/packages/db";
import { requireAuth } from "./auth";
import { success, failure } from "@/packages/utils/response";

/* ────────────────────────────────────────────────────────────── */
/* helpers                                                        */
/* ────────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────────── */
/* GET /api/me                                                    */
/* ────────────────────────────────────────────────────────────── */

export async function handleMe(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  const { user } = authResult;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [
    dbUser,
    submissions,
    ratingHistoryRaw,
    verdictCounts,
    languageCounts,
    recentActivity,
    allSubmissions,
    solvedProblemsData,
    contestStats,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        _count: { select: { submissions: true, leaderboardEntries: true } },
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
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            tags: true,
          },
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

    prisma.submission.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { status: true },
    }),

    prisma.submission.groupBy({
      by: ["language"],
      where: { userId: user.id },
      orderBy: { _count: { language: "desc" } },
      _count: { language: true },
    }),

    prisma.submission.groupBy({
      by: ["status"],
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      _count: { status: true },
    }),

    prisma.submission.findMany({
      where: { userId: user.id, createdAt: { gte: oneYearAgo } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, status: true },
    }),

    prisma.submission.findMany({
      where: { userId: user.id, status: "ACCEPTED" },
      distinct: ["problemId"],
      select: { problem: { select: { difficulty: true, tags: true } } },
    }),

    prisma.leaderboardEntry.findMany({
      where: { userId: user.id },
      select: { rank: true, contest: { select: { isRated: true } } },
    }),
  ]);

  if (!dbUser) {
    return failure("User not found", null, 404);
  }

  /* ────────────────────────────────────────────────────────────── */
  /* core stats                                                     */
  /* ────────────────────────────────────────────────────────────── */

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

  const verdictMap: Record<string, number> = {};
  for (const v of verdictCounts) verdictMap[v.status] = v._count.status;

  const acceptedCount = verdictMap["ACCEPTED"] ?? 0;
  const totalSubmissions = dbUser._count.submissions ?? 0;
  const acceptanceRate =
    totalSubmissions > 0
      ? Math.round((acceptedCount / totalSubmissions) * 100)
      : 0;

  /* ────────────────────────────────────────────────────────────── */
  /* difficulty breakdown                                          */
  /* ────────────────────────────────────────────────────────────── */

  const difficultyBreakdown = {
    EASY: solvedProblemsData.filter((s) => s.problem?.difficulty === "EASY")
      .length,
    MEDIUM: solvedProblemsData.filter((s) => s.problem?.difficulty === "MEDIUM")
      .length,
    HARD: solvedProblemsData.filter((s) => s.problem?.difficulty === "HARD")
      .length,
  };

  /* ────────────────────────────────────────────────────────────── */
  /* tags breakdown                                                */
  /* ────────────────────────────────────────────────────────────── */

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

  /* ────────────────────────────────────────────────────────────── */
  /* heatmap data                                                  */
  /* ────────────────────────────────────────────────────────────── */

  const heatmap: Record<string, { count: number; accepted: number }> = {};
  for (const sub of allSubmissions) {
    const date = sub.createdAt.toISOString().split("T")[0];
    if (!heatmap[date]) heatmap[date] = { count: 0, accepted: 0 };
    heatmap[date].count++;
    if (sub.status === "ACCEPTED") heatmap[date].accepted++;
  }

  /* ────────────────────────────────────────────────────────────── */
  /* streak                                                        */
  /* ────────────────────────────────────────────────────────────── */

  const submissionDates = allSubmissions.map((s) => new Date(s.createdAt));
  const streak = calculateStreak(submissionDates);

  /* ────────────────────────────────────────────────────────────── */
  /* last 30 days                                                   */
  /* ────────────────────────────────────────────────────────────── */

  const last30Map: Record<string, number> = {};
  for (const v of recentActivity) last30Map[v.status] = v._count.status;
  const last30Days = {
    submissions: Object.values(last30Map).reduce((a, b) => a + b, 0),
    accepted: last30Map["ACCEPTED"] ?? 0,
  };

  /* ────────────────────────────────────────────────────────────── */
  /* member stats                                                   */
  /* ────────────────────────────────────────────────────────────── */

  const daysSinceJoined = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(dbUser.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const avgSubmissionsPerDay =
    daysSinceJoined > 0 ? (totalSubmissions / daysSinceJoined).toFixed(1) : "0";

  /* ────────────────────────────────────────────────────────────── */
  /* contest performance                                            */
  /* ────────────────────────────────────────────────────────────── */

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

  const contestPerformance = {
    totalRated: ratedContests.length,
    bestRank,
    avgRank,
    totalWins,
  };

  /* ────────────────────────────────────────────────────────────── */
  /* badges                                                        */
  /* ────────────────────────────────────────────────────────────── */

  const stats = {
    totalSubmissions,
    acceptedCount,
    solvedCount: solvedProblemsData.length,
    difficultyBreakdown,
    streak,
    contestsEntered: dbUser._count.leaderboardEntries ?? 0,
    ratingDelta,
  };

  const earnedBadges = BADGES.filter((b) => b.condition(stats)).map((b) => ({
    id: b.id,
    name: b.name,
    desc: b.desc,
    icon: b.icon,
  }));

  /* ────────────────────────────────────────────────────────────── */
  /* percentile                                                    */
  /* ────────────────────────────────────────────────────────────── */

  const totalUsers = await prisma.user.count();
  const usersWithHigherRating = await prisma.userRating.count({
    where: { ratingAfter: { gt: currentRating ?? 0 } },
  });
  const percentile =
    currentRating !== null && totalUsers > 0
      ? Math.round(((totalUsers - usersWithHigherRating) / totalUsers) * 100)
      : null;

  /* ────────────────────────────────────────────────────────────── */
  /* response                                                       */
  /* ────────────────────────────────────────────────────────────── */

  return success("User profile retrieved", {
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username,
    role: dbUser.role,
    createdAt: dbUser.createdAt,

    /* rating */
    currentRating,
    maxRating,
    ratingDelta,
    rankTier: rankTier.tier,
    rankColor: rankTier.color,
    rankBg: rankTier.bg,
    percentile,

    /* submission stats */
    totalSubmissions,
    acceptedCount,
    acceptanceRate,
    solvedCount: solvedProblemsData.length,
    difficultyBreakdown,
    topTags,
    contestsEntered: dbUser._count.leaderboardEntries ?? 0,

    /* heatmap & streak */
    heatmap,
    streak,

    /* verdict & language */
    verdictBreakdown: verdictMap,
    languageBreakdown: languageCounts.map((l) => ({
      language: l.language,
      count: l._count.language,
    })),

    /* last 30 days */
    last30Days,

    /* contest performance */
    contestPerformance,

    /* badges */
    badges: earnedBadges,

    /* recent submissions */
    recentSubmissions: submissions.map((s) => ({
      id: s.id,
      status: s.status,
      language: s.language,
      executionTimeMs: s.executionTimeMs,
      memoryUsedKb: s.memoryUsedKb,
      createdAt: s.createdAt,
      problem: s.problem,
      contest: s.contest ?? null,
    })),

    /* rating history */
    ratingHistory: ratingHistoryRaw.map((r) => ({
      contestId: r.contestId,
      contestTitle: r.contest?.title ?? "Unknown contest",
      contestSlug: r.contest?.slug ?? r.contestId,
      ratingBefore: r.ratingBefore ?? 0,
      ratingAfter: r.ratingAfter ?? 0,
      delta: (r.ratingAfter ?? 0) - (r.ratingBefore ?? 0),
      rank: r.rank ?? 0,
      createdAt: r.createdAt,
    })),

    /* misc stats */
    stats: {
      daysSinceJoined,
      avgSubmissionsPerDay,
    },
  });
}

/* ────────────────────────────────────────────────────────────── */
/* POST /api/me                                                   */
/* ────────────────────────────────────────────────────────────── */

export async function handleMePost(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  const { user } = authResult;
  const body = await req.json();
  const rating = Number(body?.rating);

  if (!Number.isFinite(rating)) {
    return failure("rating must be a number", null, 400);
  }

  const lastRating = await prisma.userRating.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { ratingAfter: true },
  });

  if (lastRating?.ratingAfter === rating) {
    return failure("rating unchanged", null, 400);
  }

  await prisma.userRating.create({
    data: {
      userId: user.id,
      contestId: "manual",
      ratingBefore: lastRating?.ratingAfter ?? rating,
      ratingAfter: rating,
      rank: 0,
    },
  });

  return success("rating updated", { rating });
}
