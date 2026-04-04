import { prisma } from "./index";
import { createHash, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Seeding database...");

  // Clear existing data (order matters because of FK relations)
  await prisma.plagiarismReport.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.contestProblem.deleteMany();
  await prisma.contestAnnouncement.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.userRating.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log(" Database cleared");

  // USERS
  const user1 = await prisma.user.create({
    data: {
      email: "user1@example.com",
      username: "user1",
      passwordHash: hashPassword("password123"),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "user2@example.com",
      username: "user2",
      passwordHash: hashPassword("password123"),
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      username: "admin",
      role: "ADMIN",
      passwordHash: hashPassword("admin123"),
    },
  });

  console.log("Users created");

  // PROBLEMS
  const twoSum = await prisma.problem.create({
    data: {
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "EASY",
      statement:
        "Given an array of integers, return indices of two numbers that add up to a target.",
      tags: ["arrays", "hashmap"],
      isPublic: true,
      testCases: {
        create: [
          {
            input: "4\n2 7 11 15\n9",
            expectedOutput: "0 1",
            isSample: true,
          },
          {
            input: "3\n3 2 4\n6",
            expectedOutput: "1 2",
          },
        ],
      },
    },
  });

  const binarySearch = await prisma.problem.create({
    data: {
      title: "Binary Search",
      slug: "binary-search",
      difficulty: "EASY",
      statement: "Search for a target in a sorted array.",
      tags: ["binary-search"],
      isPublic: true,
      testCases: {
        create: [
          {
            input: "5\n1 2 3 4 5\n4",
            expectedOutput: "3",
            isSample: true,
          },
        ],
      },
    },
  });

  console.log("Problems created");

  // CONTEST
  const contest = await prisma.contest.create({
    data: {
      title: "AlgoHaven Weekly #1",
      slug: "algohaven-weekly-1",
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 2),
      isRated: true,
    },
  });

  console.log("Contest created");

  // LINK PROBLEMS TO CONTEST
  await prisma.contestProblem.createMany({
    data: [
      {
        contestId: contest.id,
        problemId: twoSum.id,
        index: 1,
        points: 100,
      },
      {
        contestId: contest.id,
        problemId: binarySearch.id,
        index: 2,
        points: 200,
      },
    ],
  });

  console.log("Problems linked to contest");

  // SUBMISSIONS
  await prisma.submission.create({
    data: {
      userId: user1.id,
      problemId: twoSum.id,
      contestId: contest.id,
      code: "print('hello world')",
      language: "python",
      status: "ACCEPTED",
      judgePhase: "CONTEST_PHASE1",
      points: 100,
      executionTimeMs: 12,
      memoryUsedKb: 2048,
    },
  });

  await prisma.submission.create({
    data: {
      userId: user2.id,
      problemId: binarySearch.id,
      contestId: contest.id,
      code: "int main(){}",
      language: "cpp",
      status: "WRONG_ANSWER",
      judgePhase: "CONTEST_PHASE1",
      points: 0,
    },
  });

  console.log(" Submissions created");

  console.log(" Seeding completed");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
