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
  MagicLinkToken,
  Session,
} from "./generated/prisma/client";

console.log("[DB] Loading, DATABASE_URL:", process.env.DATABASE_URL);

const connectionString = process.env.DATABASE_URL as string;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
