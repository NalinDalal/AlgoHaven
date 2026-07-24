import { be } from "@algohaven/logger";

function getWorkerSecret(): string {
  const s = process.env.WORKER_SECRET;
  if (!s) throw new Error("WORKER_SECRET env var required");
  return s;
}

function getWorkerUrl(): string {
  const u = process.env.WORKER_URL;
  if (!u) throw new Error("WORKER_URL env var required");
  return u;
}

export async function sendToWorker(
  submissionId: string,
  code: string,
  language: string,
  testCases: { input: string; expectedOutput: string }[],
  judgePhase: string,
  hasCustomChecker: boolean = false,
  checkerCode?: string,
) {
  try {
    const res = await fetch(`${getWorkerUrl()}/api/worker/enqueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret": getWorkerSecret(),
      },
      body: JSON.stringify({
        submissionId,
        code,
        language,
        testCases,
        judgePhase,
        hasCustomChecker,
        checkerCode,
      }),
    });
    if (!res.ok) {
      be.error({ submissionId, status: res.status }, "Worker enqueue failed");
    }
    return res.ok;
  } catch (error) {
    be.error({ submissionId, error: error instanceof Error ? error.message : "Unknown error" }, "Worker enqueue error");
    return false;
  }
}
