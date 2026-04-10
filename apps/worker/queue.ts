import { Queue, Worker, Job } from "bullmq";
import { redis as ioredis } from "@algohaven/redis";
import { worker } from "@algohaven/logger";

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface JobData {
  submissionId: string;
  code: string;
  language: string;
  testCases: TestCase[];
}

export interface CompletedJob {
  id: string;
  submissionId: string;
  status: string;
  executionTimeMs: number;
}

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const submissionQueue = new Queue<JobData>("submissions", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export async function enqueueSubmission(jobData: JobData): Promise<string> {
  const job = await submissionQueue.add("submission", jobData, {
    jobId: jobData.submissionId,
  });
  worker.info(
    { submissionId: jobData.submissionId, jobId: job.id },
    "Job enqueued",
  );
  return job.id!;
}

export async function getQueueLength(): Promise<number> {
  return submissionQueue.getWaitingCount();
}

export async function getActiveJob(): Promise<
  Job<JobData, CompletedJob> | undefined
> {
  const active = await submissionQueue.getActive();
  return active[0];
}

export async function getCompletedJobs(): Promise<CompletedJob[]> {
  const jobs = await submissionQueue.getCompleted();
  return Promise.all(
    jobs.map(async (job) => ({
      id: job.id!,
      submissionId: job.data.submissionId,
      status: (job.returnvalue as CompletedJob)?.status || "UNKNOWN",
      executionTimeMs: (job.returnvalue as CompletedJob)?.executionTimeMs || 0,
    })),
  );
}

export async function clearFailedJobs(): Promise<void> {
  await submissionQueue.clean(1000, 100, "failed");
}

export async function drainQueue(): Promise<void> {
  await submissionQueue.drain();
}
