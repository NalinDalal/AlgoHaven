import { prisma } from '@/packages/db';
import { requireAuth } from './auth';

// GET /api/me
// Returns full Codeforces-style profile:
// identity, current rating, rank tier, submission stats, recent submissions,
// contest history with rating deltas, and per-language breakdown.
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

    // Last 20 submissions with problem title + contest context
    prisma.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        language: true,
        executionTimeMs: true,
        memoryUsedKb: true,
        createdAt: true,
        contestId: true,
        problem: { select: { id: true, title: true, slug: true, difficulty: true } },
        contest:  { select: { id: true, title: true, slug: true } },
      },
    }),

    // Full rating history ordered oldest-first for the graph
    prisma.userRating.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
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
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Rating & rank tier ───────────────────────────────────────────────────
  const currentRating = ratingHistory.at(-1)?.ratingAfter ?? null;

  // Codeforces-style rank tiers
  function getRankTier(rating: number | null): { tier: string; color: string } {
    if (rating === null) return { tier: 'Unrated',        color: '#888888' };
    if (rating < 1200)   return { tier: 'Newbie',         color: '#808080' };
    if (rating < 1400)   return { tier: 'Pupil',          color: '#008000' };
    if (rating < 1600)   return { tier: 'Specialist',     color: '#03a89e' };
    if (rating < 1900)   return { tier: 'Expert',         color: '#0000ff' };
    if (rating < 2100)   return { tier: 'Candidate Master', color: '#aa00aa' };
    if (rating < 2300)   return { tier: 'Master',         color: '#ff8c00' };
    if (rating < 2400)   return { tier: 'International Master', color: '#ff8c00' };
    if (rating < 2600)   return { tier: 'Grandmaster',    color: '#ff0000' };
    if (rating < 3000)   return { tier: 'International Grandmaster', color: '#ff0000' };
    return                        { tier: 'Legendary Grandmaster',   color: '#ff0000' };
  }

  const rankTier = getRankTier(currentRating);

  // ── Submission stats ─────────────────────────────────────────────────────
  // Count verdicts across all submissions (one DB query with groupBy)
  const verdictCounts = await prisma.submission.groupBy({
    by: ['status'],
    where: { userId: user.id },
    _count: { status: true },
  });

  const verdictMap: Record<string, number> = {};
  for (const v of verdictCounts) {
    verdictMap[v.status] = v._count.status;
  }

  const acceptedCount = verdictMap['ACCEPTED'] ?? 0;
  const totalCount    = dbUser._count.submissions ?? 0;
  const acceptanceRate =
    totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

  // Unique problems solved (distinct problemIds with an ACCEPTED submission)
  const solvedProblems = await prisma.submission.findMany({
    where: { userId: user.id, status: 'ACCEPTED' },
    distinct: ['problemId'],
    select: { problemId: true },
  });

  // Per-language breakdown
  const languageCounts = await prisma.submission.groupBy({
    by: ['language'],
    where: { userId: user.id },
    _count: { language: true },
    orderBy: { _count: { language: 'desc' } },
  });

  return new Response(
    JSON.stringify({
      // Identity
      id:        dbUser.id,
      email:     dbUser.email,
      username:  dbUser.username,
      role:      dbUser.role,
      createdAt: dbUser.createdAt,

      // Rating
      currentRating: currentRating ?? null,
      rankTier:  rankTier.tier,
      rankColor: rankTier.color,
      maxRating: ratingHistory.length > 0
        ? Math.max(...ratingHistory.map((r) => r.ratingAfter ?? 0))
        : null,

      // Submission stats
      totalSubmissions:  totalCount,
      acceptedCount:     acceptedCount,
      acceptanceRate:    acceptanceRate,
      solvedCount:       solvedProblems.length,
      contestsEntered:   dbUser._count.leaderboardEntries ?? 0,
      verdictBreakdown:  verdictMap,
      languageBreakdown: languageCounts.map((l) => ({
        language: l.language,
        count:    l._count.language,
      })),

      // Recent activity
      recentSubmissions: recentSubmissions.map((s) => ({
        id:             s.id,
        status:         s.status,
        language:       s.language,
        executionTimeMs: s.executionTimeMs,
        memoryUsedKb:   s.memoryUsedKb,
        createdAt:      s.createdAt,
        problem:        s.problem,
        contest:        s.contest ?? null,
      })),

      // Rating graph data (oldest → newest)
      ratingHistory: ratingHistory.map((r) => ({
        contestId:    r.contestId,
        contestTitle: r.contest?.title ?? 'Unknown contest',
        contestSlug:  r.contest?.slug  ?? r.contestId,
        ratingBefore: r.ratingBefore ?? 0,
        ratingAfter:  r.ratingAfter ?? 0,
        delta:        (r.ratingAfter ?? 0) - (r.ratingBefore ?? 0),
        rank:         r.rank ?? 0,
        createdAt:    r.createdAt,
      })),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}