import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

export { JudgePhase, Role, SubmissionStatus } from "./generated/prisma/client";
export type {
  User,
  Contest,
  ContestProblem,
  ContestAnnouncement,
  LeaderboardEntry,
  UserRating,
  Problem,
  TestCase,
  Submission,
  PlagiarismReport,
  RejudgeJob,
  Session,
} from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
