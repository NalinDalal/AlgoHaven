import { prisma } from '@/packages/db';
import { requireAdmin,requireAuth } from './auth';


/*
//contest routes
  '/api/contest':{GET: listContest},
  '/api/contest/:id':{GET: getContestDetails},
  '/api/contest/:id/register':{POST: registerForContest},
  '/api/contest/:id/unregister':{POST: unregisterFromContest},
  '/api/contest/:id/:problemId':{GET: listContestProblemById},
  '/api/contest/create':{POST: createContest},
  */


function getContestId(url: URL) {
  const match = url.pathname.match(/\/api\/contest\/([^/]+)/);
  return match ? match[1] : null;
}

// GET /api/contest/:id/leaderboard
// Returns top 50 users and (optionally) the requesting user's own rank
export async function getContestLeaderboard(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const contestId = getContestId(url);
  if (!contestId) return Response.json({ error: 'Invalid contest id' }, { status: 400 });

  // Get top 50
  const top = await prisma.leaderboardEntry.findMany({
    where: { contestId },
    orderBy: [
      { totalPoints: 'desc' },
      { penaltyMins: 'asc' },
      { lastSolvedAt: 'asc' },
    ],
    take: 50,
    include: { user: { select: { id: true, username: true, email: true } } },
  });

  // Optionally, get current user's rank if authenticated
  let userRank = null;
  const authResult = await requireAuth(req);
  if (!(authResult instanceof Response)) {
    const user = authResult.user;
    const entry = await prisma.leaderboardEntry.findUnique({
      where: { contestId_userId: { contestId, userId: user.id } },
    });
    if (entry) {
      // Build OR conditions for rank calculation
      const orConditions: any[] = [
        { totalPoints: { gt: entry.totalPoints } },
        {
          totalPoints: entry.totalPoints,
          penaltyMins: { lt: entry.penaltyMins },
        },
      ];
      if (entry.lastSolvedAt) {
        orConditions.push({
          totalPoints: entry.totalPoints,
          penaltyMins: entry.penaltyMins,
          lastSolvedAt: { lt: entry.lastSolvedAt },
        });
      }
      const rank = await prisma.leaderboardEntry.count({
        where: {
          contestId,
          OR: orConditions,
        },
      });
      userRank = rank + 1;
    }
  }

  return Response.json({ top, userRank });
}

// GET /api/contest/:id/ratings
// Returns user ratings for a contest
export async function getContestRatings(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const contestId = getContestId(url);
  if (!contestId) return Response.json({ error: 'Invalid contest id' }, { status: 400 });

  const ratings = await prisma.userRating.findMany({
    where: { contestId },
    orderBy: { rank: 'asc' },
    include: { user: { select: { id: true, username: true, email: true } } },
  });
  return Response.json({ ratings });
}

// GET /api/contest
export async function listContest(req: Request): Promise<Response> {
  const contests = await prisma.contest.findMany({
    orderBy: { startTime: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      startTime: true,
      endTime: true,
      visibility: true,
      isRated: true
    }
  });

  return Response.json({ contests });
}


// GET /api/contest/:id
export async function getContestDetails(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const contestId = getContestId(url);

  if (!contestId)
    return Response.json({ error: 'Invalid contest id' }, { status: 400 });

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      problems: {
        select: {
          index: true,
          points: true,
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true
            }
          }
        },
        orderBy: { index: 'asc' }
      }
    }
  });

  if (!contest)
    return Response.json({ error: 'Contest not found' }, { status: 404 });

  return Response.json({ contest });
}


// POST /api/contest/:id/register
export async function registerForContest(req: Request): Promise<Response> {

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const user = authResult.user;

  const url = new URL(req.url);
  const contestId = getContestId(url);

  if (!contestId)
    return Response.json({ error: 'Invalid contest id' }, { status: 400 });


  const contest = await prisma.contest.findUnique({
    where: { id: contestId }
  });

  if (!contest)
    return Response.json({ error: 'Contest not found' }, { status: 404 });


  if (!contest.registrationOpen)
    return Response.json(
      { error: 'Registration closed' },
      { status: 400 }
    );


  const existing = await prisma.leaderboardEntry.findUnique({
    where: {
      contestId_userId: {
        contestId,
        userId: user.id
      }
    }
  });

  if (existing)
    return Response.json(
      { error: 'Already registered' },
      { status: 400 }
    );


  await prisma.leaderboardEntry.create({
    data: {
      contestId,
      userId: user.id
    }
  });

  return Response.json({ message: 'Registered successfully' });
}


// POST /api/contest/:id/unregister
export async function unregisterFromContest(req: Request): Promise<Response> {

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const user = authResult.user;

  const url = new URL(req.url);
  const contestId = getContestId(url);

  if (!contestId)
    return Response.json({ error: 'Invalid contest id' }, { status: 400 });


  const entry = await prisma.leaderboardEntry.findUnique({
    where: {
      contestId_userId: {
        contestId,
        userId: user.id
      }
    }
  });

  if (!entry)
    return Response.json(
      { error: 'Not registered' },
      { status: 400 }
    );


  await prisma.leaderboardEntry.delete({
    where: {
      contestId_userId: {
        contestId,
        userId: user.id
      }
    }
  });

  return Response.json({ message: 'Unregistered successfully' });
}


// POST /api/contest/create
export async function createContest(req: Request): Promise<Response> {

  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;
  const user = authResult.user;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    title,
    slug,
    startTime,
    endTime,
    visibility,
    isRated,
    freezeTime,
    isPractice,
    registrationOpen,
    problems
  } = body || {};

  if (!title || !slug || !startTime || !endTime)
    return Response.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );

  const contest = await prisma.contest.create({
    data: {
      title,
      slug,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      visibility: visibility || 'PUBLIC',
      isRated: !!isRated,
      freezeTime: freezeTime ? new Date(freezeTime) : null,
      isPractice: !!isPractice,
      registrationOpen: registrationOpen !== false,
      problems: Array.isArray(problems)
        ? {
            create: problems.map((p: any, i: number) => ({
              problemId: p.problemId,
              index: i,
              points: p.points || 100
            }))
          }
        : undefined
    }
  });

  return Response.json({ contest }, { status: 201 });
}


// GET /api/contest/:id/problems
//returns list of problems in the contest with their details
export async function listContestProblems(req: Request): Promise<Response> {

  const url = new URL(req.url);
  const contestId = getContestId(url);

  if (!contestId)
    return Response.json({ error: 'Invalid contest id' }, { status: 400 });


  const problems = await prisma.contestProblem.findMany({
    where: { contestId },
    orderBy: { index: 'asc' },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          difficulty: true,
          timeLimitMs: true,
          memoryLimitKb: true
        }
      }
    }
  });

  return Response.json({ problems });
}

//GET '/api/contest/:id/problems/:problemId':{GET: listContestProblemById},
//returns problem details for the specific problem in the contest by problemId and contestId
export async function listContestProblemById(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const contestIdMatch = url.pathname.match(/\/api\/contest\/([^/]+)/);
    const contestId = contestIdMatch ? contestIdMatch[1] : null;
    const problemIdMatch = url.pathname.match(/\/problems\/([^/]+)/);
    const problemId = problemIdMatch ? problemIdMatch[1] : null;

    if (!contestId || !problemId) {
      return Response.json({ error: 'Invalid contest or problem id' }, { status: 400 });
    }

    const problem = await prisma.contestProblem.findFirst({
      where: {
        contestId,
        problemId: problemId
      },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            statement: true,
            timeLimitMs: true,
            memoryLimitKb: true,
            //return only public test cases for the problem in the contest
            testCases: {
              where: {
                isSample: true
              },
              select: {
                input: true,
                expectedOutput: true
              }
            }
          }
        }
      }
    });

    if (!problem) {
      return Response.json({ error: 'Problem not found in this contest' }, { status: 404 });
    }

    return Response.json({ problem });
}

// POST '/api/contest/:id/problems/:problemId':{POST: submitContestProblemSolution},
//submitting solution for a problem in the contest by problemId and contestId
export async function submitContestProblemSolution(req: Request): Promise<Response> {
  // Authenticate user
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const user = authResult.user;

  // Extract contestId and problemId from URL
  const url = new URL(req.url);
  const contestIdMatch = url.pathname.match(/\/api\/contest\/([^/]+)/);
  const contestId = contestIdMatch ? contestIdMatch[1] : null;
  const problemIdMatch = url.pathname.match(/\/problems\/([^/]+)/);
  const problemId = problemIdMatch ? problemIdMatch[1] : null;

  if (!contestId || !problemId) {
    return Response.json({ error: 'Invalid contest or problem id' }, { status: 400 });
  }

  // Parse submission details
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { code, language } = body || {};
  if (!code || !language) {
    return Response.json({ error: 'Missing code or language' }, { status: 400 });
  }

  // Create submission in DB
  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      problemId: problemId,
      contestId,
      code,
      language,
      status: 'QUEUED',
      judgePhase: 'CONTEST_PHASE1',
    }
  });

  // Return submission id and status
  return Response.json({ submission_id: submission.id, status: submission.status }, { status: 201 });
}