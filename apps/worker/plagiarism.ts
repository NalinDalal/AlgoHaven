import { worker } from "@algohaven/logger";

const WORKER_URL = process.env.WORKER_URL;
const BACKEND_URL = process.env.BACKEND_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

function requireEnv(): void {
  if (!WORKER_URL || !BACKEND_URL || !WORKER_SECRET) {
    throw new Error("WORKER_URL, BACKEND_URL, and WORKER_SECRET env vars required");
  }
}

function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface PlagiarismSubmission {
  id: string;
  code: string;
  userId: string;
}

export async function checkContestPlagiarism(
  contestId: string,
): Promise<void> {
  requireEnv();
  worker.info({ contestId }, "Starting plagiarism check");
  
  const res = await fetch(
    `${BACKEND_URL}/api/contest/${contestId}/submissions`,
    { headers: { "x-worker-secret": WORKER_SECRET! } },
  );
  if (!res.ok) throw new Error(`Failed to fetch submissions: ${res.status}`);
  const body = await res.json() as { data?: { submissions?: PlagiarismSubmission[] } };
  const submissions = body.data?.submissions ?? [];

  const accepted = submissions.filter((s) => s.code);
  if (accepted.length < 2) {
    worker.info({ contestId, submissionCount: accepted.length }, "Not enough submissions for plagiarism check");
    return;
  }

  const hashed = await Promise.all(
    accepted.map(async (s) => ({
      ...s,
      hash: await sha256(normalizeCode(s.code)),
    })),
  );

  const groups = new Map<string, PlagiarismSubmission[]>();
  for (const s of hashed) {
    const g = groups.get(s.hash) ?? [];
    g.push(s);
    groups.set(s.hash, g);
  }

  const reports: { submissionId: string; matchedWithId: string }[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      const a = group[i];
      if (!a) continue;
      for (let j = i + 1; j < group.length; j++) {
        const b = group[j];
        if (!b) continue;
        reports.push({ submissionId: a.id, matchedWithId: b.id });
        reports.push({ submissionId: b.id, matchedWithId: a.id });
      }
    }
  }

  if (reports.length === 0) {
    worker.info({ contestId }, "No plagiarism detected");
    return;
  }

  worker.warn({ contestId, matchCount: reports.length / 2 }, "Plagiarism detected");

  const updateRes = await fetch(`${BACKEND_URL}/api/worker/update-plagiarism`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-worker-secret": WORKER_SECRET!,
    },
    body: JSON.stringify({ contestId, reports }),
  });
  if (!updateRes.ok) throw new Error(`Failed to report plagiarism: ${updateRes.status}`);
  
  worker.info({ contestId, reportCount: reports.length }, "Plagiarism reports submitted");
}
