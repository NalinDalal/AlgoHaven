import { serve } from "bun";
import { Buffer } from "buffer";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const WORKER_SECRET = process.env.WORKER_SECRET || "dev-secret-change-in-prod";

const LANGUAGE_CONFIG: Record<string, { image: string; timeout: number }> = {
  python: { image: "python:3.11-slim", timeout: 5 },
  javascript: { image: "node:20-slim", timeout: 5 },
};

const DOCKER_OPTIONS = [
  "--rm",
  "--cpus=0.5",
  "--memory=256m",
  "--network=none",
  "--user=1000",
  "--cap-drop=ALL",
  "--security-opt=no-new-privileges",
  "--pids-limit=50",
];

function toBase64(str: string): string {
  return Buffer.from(str).toString("base64");
}

async function runCode(
  code: string,
  input: string,
  language: string,
): Promise<{
  status: string;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
}> {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return {
      status: "COMPILE_ERROR",
      stdout: "",
      stderr: `Unsupported language: ${language}`,
      executionTimeMs: 0,
    };
  }

  const startTime = Date.now();

  try {
    let cmd: string[] = [];
    const codeB64 = toBase64(code);
    const inputB64 = toBase64(input);

    if (language === "python") {
      const codeFilePath = `/tmp/submission.py`;

      cmd = [
        "docker",
        "run",
        ...DOCKER_OPTIONS,
        "-i",
        config.image,
        "bash",
        "-c",
        `printf '%s' '${codeB64}' | base64 -d > ${codeFilePath} && printf '%s\\n' '${inputB64}' | base64 -d | python3 ${codeFilePath}`,
      ];
    } else if (language === "javascript") {
      const codeFilePath = `/tmp/submission.js`;

      cmd = [
        "docker",
        "run",
        ...DOCKER_OPTIONS,
        "-i",
        config.image,
        "bash",
        "-c",
        `printf '%s' '${codeB64}' | base64 -d > ${codeFilePath} && printf '%s\\n' '${inputB64}' | base64 -d | node ${codeFilePath}`,
      ];
    }

    const proc = Bun.spawn(cmd);

    const exitCode = await proc.exited;

    let stdout = "";
    let stderr = "";

    try {
      stdout = await new Response(proc.stdout).text();
      stderr = await new Response(proc.stderr).text();
    } catch (e) {
      console.log(`[Worker] Decode error:`, e);
    }

    const executionTimeMs = Date.now() - startTime;

    if (exitCode === 0) {
      return {
        status: "OK",
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        executionTimeMs,
      };
    } else {
      return {
        status: "RUNTIME_ERROR",
        stdout: stdout.trim(),
        stderr: stderr.trim() || "Runtime error",
        executionTimeMs,
      };
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Execution failed";
    return {
      status: "RUNTIME_ERROR",
      stdout: "",
      stderr: errMsg,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

// In-memory queue
const jobQueue: {
  submissionId: string;
  code: string;
  language: string;
  testCases: { input: string; expectedOutput: string }[];
}[] = [];

async function enqueueSubmission(
  submissionId: string,
  code: string,
  language: string,
  testCases: { input: string; expectedOutput: string }[],
) {
  jobQueue.push({ submissionId, code, language, testCases });
  processNext();
}

async function processNext() {
  if (jobQueue.length === 0) return;

  const job = jobQueue.shift();
  if (job) {
    console.log(`[Worker] Processing submission ${job.submissionId}`);
    console.log(
      `[Worker] Language: ${job.language}, Test cases: ${job.testCases.length}`,
    );

    let allAccepted = true;
    let totalTime = 0;

    for (const testCase of job.testCases) {
      const result = await runCode(job.code, testCase.input, job.language);
      totalTime += result.executionTimeMs;

      // Compare output
      const actual = result.stdout.trim();
      const expected = testCase.expectedOutput.trim();

      if (result.status === "TLE") {
        console.log(`[Worker] Test case TLE`);
        allAccepted = false;
      } else if (result.status === "RUNTIME_ERROR") {
        console.log(`[Worker] Test case RUNTIME_ERROR: ${result.stderr}`);
        allAccepted = false;
      } else if (actual === expected) {
        console.log(`[Worker] Test case ACCEPTED`);
      } else {
        console.log(`[Worker] Test case WRONG_ANSWER`);
        console.log(`[Worker]   Expected: "${expected}"`);
        console.log(`[Worker]   Got: "${actual}"`);
        allAccepted = false;
      }
    }

    const finalStatus = allAccepted ? "ACCEPTED" : "WRONG_ANSWER";
    console.log(
      `[Worker] Submission ${job.submissionId} final: ${finalStatus} (${totalTime}ms)`,
    );

    // Update submission status in database
    try {
      const res = await fetch(`${BACKEND_URL}/api/worker/update-submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-secret": WORKER_SECRET,
        },
        body: JSON.stringify({
          submissionId: job.submissionId,
          status: finalStatus,
          executionTimeMs: totalTime,
        }),
      });
      if (res.ok) {
        console.log(
          `[Worker] Updated submission ${job.submissionId} to ${finalStatus}`,
        );
      } else {
        console.error(`[Worker] Failed to update submission: ${res.status}`);
      }
    } catch (err) {
      console.error(`[Worker] Error updating submission:`, err);
    }
  }

  setTimeout(processNext, 100);
}

async function handleEnqueue(req: Request): Promise<Response> {
  const body = await req.json();
  const { submissionId, code, language, testCases } = body;

  if (!submissionId || !code || !language) {
    return new Response(
      JSON.stringify({ error: "submissionId, code, and language required" }),
      { status: 400 },
    );
  }

  await enqueueSubmission(submissionId, code, language, testCases || []);

  return new Response(JSON.stringify({ message: "Job enqueued" }), {
    status: 200,
  });
}

async function handleHealth(): Promise<Response> {
  return new Response(
    JSON.stringify({
      status: "ok",
      queueLength: jobQueue.length,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}

const server = serve({
  port: 3002,
  fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/api/worker/enqueue") {
      return handleEnqueue(req);
    }

    if (req.method === "GET" && url.pathname === "/api/worker/health") {
      return handleHealth();
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`[Worker] Code execution service running on port ${server.port}`);
console.log(`[Worker] Endpoints:`);
console.log(`  POST /api/worker/enqueue - Add submission to queue`);
console.log(`  GET  /api/worker/health  - Health check`);
