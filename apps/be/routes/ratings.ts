import { prisma, SubmissionStatus, Role } from "@/packages/db";
import { requireAdmin } from "./auth";
import { success, failure } from "@/packages/utils/response";
import { be } from "@algohaven/logger";
import { getIdParams } from "@/packages/utils/routeTypes";

const DEFAULT_RATING = 1500;
const MAX_DELTA = 120;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function computeDelta(
  actualRank: number,
  expectedRank: number,
  currentRating: number,
  numParticipants: number,
): number {
  const raw = (expectedRank - actualRank) * (200 / Math.max(numParticipants, 1));
  const scaled = raw * Math.max(1, 1500 / Math.max(currentRating, 1));
  return Math.round(Math.max(-MAX_DELTA, Math.min(MAX_DELTA, scaled)));
}

async function getCurrentRating(userId: string): Promise<number> {
  const last = await prisma.userRating.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { ratingAfter: true },
  });
  return last?.ratingAfter ?? DEFAULT_RATING;
}

export async function handleCalculateRatings(req: Request): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const { id: contestId } = getIdParams(req);
  if (!contestId) return failure("Missing contest id", null, 400);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return failure("Contest not found", null, 404);
  if (!contest.isRated) return failure("This is not a rated contest", null, 400);
  if (new Date() <= contest.endTime)
    return failure("Ratings can only be calculated after the contest ends", null, 400);

  const entries = await prisma.leaderboardEntry.findMany({
    where: { contestId },
    select: { userId: true, rank: true, totalPoints: true, solved: true },
    orderBy: [{ totalPoints: "desc" }, { solved: "desc" }],
  });

  if (entries.length < 2) {
    return failure("Need at least 2 participants to calculate ratings", null, 400);
  }

  const userIds = entries.map((e) => e.userId);
  const currentRatings = new Map<string, number>();
  for (const id of userIds) {
    currentRatings.set(id, await getCurrentRating(id));
  }

  const allRatings = userIds.map((id) => currentRatings.get(id)!);

  const ratingChanges: { userId: string; ratingBefore: number; ratingAfter: number; rank: number }[] = [];

  for (const entry of entries) {
    const rating = currentRatings.get(entry.userId)!;

    let expectedRank = 1;
    for (const r of allRatings) {
      expectedRank += expectedScore(rating, r);
    }

    const actualRank = entry.rank ?? entries.indexOf(entry) + 1;
    const delta = computeDelta(actualRank, expectedRank, rating, entries.length);

    ratingChanges.push({
      userId: entry.userId,
      ratingBefore: rating,
      ratingAfter: rating + delta,
      rank: actualRank,
    });
  }

  // Ensure total delta sum is zero (redistribute rounding)
  const totalDelta = ratingChanges.reduce((sum, rc) => sum + (rc.ratingAfter - rc.ratingBefore), 0);
  if (totalDelta !== 0) {
    const adjustment = -totalDelta;
    ratingChanges[0].ratingAfter += adjustment;
  }

  await prisma.$transaction(
    ratingChanges.map((rc) =>
      prisma.userRating.create({
        data: {
          userId: rc.userId,
          contestId,
          ratingBefore: rc.ratingBefore,
          ratingAfter: rc.ratingAfter,
          rank: rc.rank,
        },
      }),
    ),
  );

  be.info({ contestId, participantCount: ratingChanges.length }, "Ratings calculated");
  return success("Ratings calculated", {
    count: ratingChanges.length,
    ratings: ratingChanges.map((rc) => ({
      ...rc,
      delta: rc.ratingAfter - rc.ratingBefore,
    })),
  });
}
