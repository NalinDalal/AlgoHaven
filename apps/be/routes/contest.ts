import { prisma } from '@/packages/db';
import { SubmissionStatus, JudgePhase,Role } from '@/packages/db';

import { requireAuth, requireAdmin } from './auth';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ContestStatus = 'upcoming' | 'live' | 'past';

function getContestStatus(startTime: Date, endTime: Date): ContestStatus {
  const now = new Date();
  if (now < startTime) return 'upcoming';
  if (now > endTime) return 'past';
  return 'live';
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// ─── 1. Contest Listing & Details ─────────────────────────────────────────────

// GET /api/contest
export async function listContest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') as ContestStatus | null;
  const page  = Math.max(1,  parseInt(url.searchParams.get('page')  ?? '1',  10));
  const limit = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20', 10));
  const skip  = (page - 1) * limit;

  const now = new Date();
  let timeFilter: Record<string, unknown> = {};
  if (status === 'upcoming') timeFilter = { startTime: { gt: now } };
  else if (status === 'live') timeFilter = { startTime: { lte: now }, endTime: { gte: now } };
  else if (status === 'past') timeFilter = { endTime: { lt: now } };

  // Auth is optional here — guests see PUBLIC/INVITE only
  const authResult = await requireAuth(req);
  const isAdmin =
    !(authResult instanceof Response) && authResult.user.role === Role.ADMIN;

  const visibilityFilter = isAdmin ? {} : { visibility: { not: 'PRIVATE' as const } };
  const where = { ...timeFilter, ...visibilityFilter };

  const [contests, total] = await Promise.all([
    prisma.contest.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        startTime: true,
        endTime: true,
        visibility: true,
        isRated: true,
        isPractice: true,
        registrationOpen: true,
        _count: { select: { leaderboard: true, problems: true } },
      },
      orderBy: { startTime: 'asc' },
      skip,
      take: limit,
    }),
    prisma.contest.count({ where }),
  ]);

  return json({
    contests: contests.map((c) => ({
      ...c,
      status: getContestStatus(c.startTime, c.endTime),
      participantCount: c._count.leaderboard,
      problemCount: c._count.problems,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/contest/:id
export async function getContestDetails(req: Request): Promise<Response> {
  const params = (req as any).params as { id: string };
  const contestId = params?.id;
  if (!contestId) return error('Missing contest id', 400);

  const authResult = await requireAuth(req);
  const isAdmin =
    !(authResult instanceof Response) && authResult.user.role === Role.ADMIN;

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      problems: {
        select: {
          id: true,
          index: true,
          points: true,
          problem: { select: { id: true, title: true, difficulty: true } },
        },
        orderBy: { index: 'asc' },
      },
      _count: { select: { leaderboard: true } },
    },
  });

  if (!contest) return error('Contest not found', 404);
  if (contest.visibility === 'PRIVATE' && !isAdmin) return error('Contest not found', 404);

  // Hide problem list until contest starts for non-admins
  const contestStarted = new Date() >= contest.startTime;
  const problems = isAdmin || contestStarted ? contest.problems : [];

  return json({
    contest: {
      id: contest.id,
      title: contest.title,
      slug: contest.slug,
      startTime: contest.startTime,
      endTime: contest.endTime,
      freezeTime: contest.freezeTime,
      visibility: contest.visibility,
      isRated: contest.isRated,
      isPractice: contest.isPractice,
      registrationOpen: contest.registrationOpen,
      status: getContestStatus(contest.startTime, contest.endTime),
      participantCount: contest._count.leaderboard,
      problems,
    },
  });
}

// ─── 2. Registration ───────────────────────────────────────────────────────────

// POST /api/contest/:id/register
// Registration = create a LeaderboardEntry row (no separate participant model in schema)
export async function registerForContest(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const contestId = (req as any).params?.id as string | undefined;
  if (!contestId) return error('Missing contest id', 400);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return error('Contest not found', 404);
  if (!contest.registrationOpen) return error('Registration is closed', 400);
  if (new Date() > contest.endTime) return error('Contest has already ended', 400);

  const existing = await prisma.leaderboardEntry.findUnique({
    where: { contestId_userId: { contestId, userId: user.id } },
  });
  if (existing) return error('Already registered', 409);

  await prisma.leaderboardEntry.create({
    data: { contestId, userId: user.id },
  });

  return json({ message: 'Registered successfully' }, 201);
}

// POST /api/contest/:id/unregister
export async function unregisterFromContest(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const contestId = (req as any).params?.id as string | undefined;
  if (!contestId) return error('Missing contest id', 400);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return error('Contest not found', 404);

  if (new Date() >= contest.startTime) {
    return error('Cannot unregister after the contest has started', 400);
  }

  const existing = await prisma.leaderboardEntry.findUnique({
    where: { contestId_userId: { contestId, userId: user.id } },
  });
  if (!existing) return error('Not registered', 404);

  await prisma.leaderboardEntry.delete({
    where: { contestId_userId: { contestId, userId: user.id } },
  });

  return json({ message: 'Unregistered successfully' });
}

// ─── 3. Problems ──────────────────────────────────────────────────────────────

// GET /api/contest/:id/problems
export async function listContestProblems(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const contestId = (req as any).params?.id as string | undefined;
  if (!contestId) return error('Missing contest id', 400);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return error('Contest not found', 404);

  const isAdmin = user.role === Role.ADMIN;
  if (!isAdmin && new Date() < contest.startTime) {
    return error('Problems are not yet available', 403);
  }

  const problems = await prisma.contestProblem.findMany({
    where: { contestId },
    orderBy: { index: 'asc' },
    select: {
      id: true,
      index: true,
      points: true,
      problem: {
        select: {
          id: true,
          title: true,
          difficulty: true,
          timeLimitMs: true,
          memoryLimitKb: true,
        },
      },
    },
  });

  return json({ problems });
}

// GET /api/contest/:id/problems/:problemId
// :problemId is Problem.id (the underlying problem UUID — consistent with index.ts router)
export async function listContestProblemById(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id: contestId, problemId } = (req as any).params as {
    id: string;
    problemId: string;
  };
  if (!contestId || !problemId) return error('Missing contest or problem id', 400);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return error('Contest not found', 404);

  const isAdmin = user.role === Role.ADMIN;
  if (!isAdmin && new Date() < contest.startTime) {
    return error('Contest has not started yet', 403);
  }

  // Look up by Problem.id — the natural FK on ContestProblem
  const contestProblem = await prisma.contestProblem.findFirst({
    where: { contestId, problemId },
    select: {
      id: true,
      index: true,
      points: true,
      problem: {
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          statement: true,
          timeLimitMs: true,
          memoryLimitKb: true,
          tags: true,
          // Only sample test cases are visible during the contest
          testCases: {
            where: { isSample: true },
            select: { id: true, input: true, expectedOutput: true },
          },
        },
      },
    },
  });

  if (!contestProblem) return error('Problem not found in this contest', 404);

  // Has the current user already AC'd this problem in this contest?
  const accepted = await prisma.submission.findFirst({
    where: {
      userId: user.id,
      problemId,
      contestId,
      status: SubmissionStatus.ACCEPTED,
    },
    select: { id: true, createdAt: true },
  });

  return json({
    problem: {
      ...contestProblem,
      userStatus: accepted ? 'solved' : 'unsolved',
      solvedAt: accepted?.createdAt ?? null,
    },
  });
}

// ─── 4. Submissions ───────────────────────────────────────────────────────────

// POST /api/contest/:id/problems/:problemId
// Body: { code: string; language: string }
// :problemId is Problem.id — validated against ContestProblem before inserting
export async function submitContestProblemSolution(req: Request): Promise<Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id: contestId, problemId } = (req as any).params as {
    id: string;
    problemId: string;
  };
  if (!contestId || !problemId) return error('Missing contest or problem id', 400);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return error('Contest not found', 404);

  const now = new Date();
  if (now < contest.startTime) return error('Contest has not started yet', 403);
  if (now > contest.endTime)   return error('Contest has ended', 403);

  // Must be registered (LeaderboardEntry exists)
  const entry = await prisma.leaderboardEntry.findUnique({
    where: { contestId_userId: { contestId, userId: user.id } },
  });
  if (!entry) return error('You are not registered for this contest', 403);

  // Verify problemId actually belongs to this contest
  const contestProblem = await prisma.contestProblem.findFirst({
    where: { contestId, problemId },
    select: { id: true },
  });
  if (!contestProblem) return error('Problem not found in this contest', 404);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return error('Invalid JSON', 400);
  }
  const { code, language } = body ?? {};
  if (!code || !language) return error('Missing code or language', 422);

  // 10-second cooldown per user × problem × contest
  const recentSub = await prisma.submission.findFirst({
    where: {
      userId: user.id,
      problemId,
      contestId,
      createdAt: { gte: new Date(now.getTime() - 10_000) },
    },
    select: { id: true },
  });
  if (recentSub) return error('Please wait before resubmitting', 429);

  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      problemId,
      contestId,
      code,
      language,
      status: SubmissionStatus.QUEUED,
      judgePhase: JudgePhase.CONTEST_PHASE1,
    },
    select: { id: true, status: true, createdAt: true },
  });

  // TODO: enqueue to judge worker
  // await judgeQueue.add('judge', { submissionId: submission.id });

  return json({ submission_id: submission.id, status: submission.status }, 201);
}

// ─── 5. Leaderboard & Ratings ─────────────────────────────────────────────────

// GET /api/contest/:id/leaderboard
// Auth optional — guests can view public leaderboards.
// Freeze: if contest.freezeTime has passed and contest is still live,
// non-admins see the leaderboard as it was at freeze time (scores stop updating).
// We do NOT filter by isFrozen flag because that depends on a background job
// having already stamped rows — instead we serve all rows and set isFrozen in
// the response so the client knows the snapshot may be stale.
export async function getContestLeaderboard(req: Request): Promise<Response> {
  const contestId = (req as any).params?.id as string | undefined;
  if (!contestId) return error('Missing contest id', 400);

  const url = new URL(req.url);
  const page  = Math.max(1,   parseInt(url.searchParams.get('page')  ?? '1',  10));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '50', 10));

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return error('Contest not found', 404);

  const authResult = await requireAuth(req);
  const isAdmin =
    !(authResult instanceof Response) && authResult.user.role === Role.ADMIN;
  const callerId =
    authResult instanceof Response ? null : authResult.user.id;

  const now = new Date();
  const isFrozen =
    !isAdmin &&
    contest.freezeTime !== null &&
    now >= contest.freezeTime &&
    now <= contest.endTime;

  // Pull all entries for rank computation; let DB do the primary sort
  const allEntries = await prisma.leaderboardEntry.findMany({
    where: { contestId },
    select: {
      userId: true,
      totalPoints: true,
      solved: true,
      penaltyMins: true,
      lastSolvedAt: true,
      rank: true,
      isFrozen: true,
      user: { select: { id: true, username: true } },
    },
    orderBy: [
      { totalPoints: 'desc' },
      { penaltyMins: 'asc'  },
      { lastSolvedAt: 'asc' },
    ],
  });

  // Re-assign ranks in-process — materialised `rank` column may lag
  const ranked = allEntries.map((e, i) => ({ ...e, rank: i + 1 }));

  const myEntry = callerId
    ? (ranked.find((e) => e.userId === callerId) ?? null)
    : null;

  const start    = (page - 1) * limit;
  const pageData = ranked.slice(start, start + limit);

  return json({
    top: pageData,
    userRank: myEntry?.rank ?? null,
    isFrozen,
    meta: {
      page,
      limit,
      total: ranked.length,
      totalPages: Math.ceil(ranked.length / limit),
    },
  });
}

// GET /api/contest/:id/ratings
// Only available after the contest has ended AND it is a rated contest.
export async function getContestRatings(req: Request): Promise<Response> {
  const contestId = (req as any).params?.id as string | undefined;
  if (!contestId) return error('Missing contest id', 400);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return error('Contest not found', 404);
  if (!contest.isRated) return error('This is not a rated contest', 400);
  if (new Date() <= contest.endTime) return error('Ratings are not yet available', 400);

  const ratings = await prisma.userRating.findMany({
    where: { contestId },
    orderBy: { rank: 'asc' },
    select: {
      userId: true,
      ratingBefore: true,
      ratingAfter: true,
      rank: true,
      user: { select: { id: true, username: true } },
    },
  });

  return json({
    ratings: ratings.map((r) => ({
      ...r,
      delta: r.ratingAfter - r.ratingBefore,
    })),
  });
}

// ─── 6. Announcements ─────────────────────────────────────────────────────────

// GET /api/contest/:id/announcements
// Public — no auth required
export async function listContestAnnouncements(req: Request): Promise<Response> {
  const contestId = (req as any).params?.id as string | undefined;
  if (!contestId) return error('Missing contest id', 400);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return error('Contest not found', 404);

  const announcements = await prisma.contestAnnouncement.findMany({
    where: { contestId },
    select: {
      id: true,
      message: true,   // schema: only `message` field — no title/body/author
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return json({ announcements });
}

// POST /api/contest/:id/announcements  [admin only]
// Body: { message: string }
// Schema note: ContestAnnouncement has only `message` + `createdAt`.
// No authorId or title — extend schema if richer announcements are needed.
export async function postContestAnnouncement(req: Request): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const contestId = (req as any).params?.id as string | undefined;
  if (!contestId) return error('Missing contest id', 400);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return error('Contest not found', 404);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return error('Invalid JSON', 400);
  }
  if (!body?.message) return error('message is required', 422);

  const announcement = await prisma.contestAnnouncement.create({
    data: { contestId, message: body.message as string },
    select: { id: true, message: true, createdAt: true },
  });

  // TODO: broadcast via WebSocket / SSE
  // await broadcastToContest(contestId, { type: 'ANNOUNCEMENT', data: announcement });

  return json({ announcement }, 201);
}

// ─── 7. Create Contest ────────────────────────────────────────────────────────

// POST /api/contest/create  [admin only]
// Body: { title, slug, startTime, endTime, visibility?, isRated?, freezeTime?,
//         isPractice?, registrationOpen?, problems?: [{ problemId, points }] }
export async function createContest(req: Request): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return error('Invalid JSON', 400);
  }

  const {
    title, slug, startTime, endTime,
    visibility, isRated, freezeTime, isPractice,
    registrationOpen, problems,
  } = body ?? {};

  if (!title || !slug || !startTime || !endTime) {
    return error('title, slug, startTime and endTime are required', 400);
  }

  const contest = await prisma.contest.create({
    data: {
      title,
      slug,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      visibility: visibility ?? 'PUBLIC',
      isRated: !!isRated,
      freezeTime: freezeTime ? new Date(freezeTime) : null,
      isPractice: !!isPractice,
      registrationOpen: registrationOpen !== false,
      problems: Array.isArray(problems)
        ? {
            create: problems.map((p: any, i: number) => ({
              problemId: p.problemId,
              index: i,
              points: p.points ?? 100,
            })),
          }
        : undefined,
    },
  });

  return json({ contest }, 201);
}