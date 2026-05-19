export async function sendToWorker(
  submissionId: string,
  code: string,
  language: string,
  testCases: { input: string; expectedOutput: string }[],
) {
  const WORKER_URL = process.env.WORKER_URL || "http://localhost:3002";
  try {
    const res = await fetch(`${WORKER_URL}/api/worker/enqueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret":
          process.env.WORKER_SECRET || "dev-secret-change-in-prod",
      },
      body: JSON.stringify({
        submissionId,
        code,
        language,
        testCases,
      }),
    });
    return res.ok;
  } catch (error) {
    return false;
  }
}
