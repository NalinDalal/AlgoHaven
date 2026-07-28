import { MAX_CODE_SIZE, MAX_INPUT_SIZE } from "./config";
import { worker } from "@algohaven/logger";

export interface EnqueueRequest {
  submissionId: string;
  code: string;
  language: string;
  testCases: { input: string; expectedOutput: string }[];
  judgePhase: string;
  hasCustomChecker: boolean;
  checkerCode?: string;
}

export function validateEnqueueRequest(body: unknown): {
  valid: boolean;
  error?: string;
  data?: EnqueueRequest;
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const data = body as Record<string, unknown>;

  if (!data.submissionId || !data.code || !data.language) {
    return { valid: false, error: "submissionId, code, and language required" };
  }

  const code = String(data.code);
  if (code.length > MAX_CODE_SIZE) {
    return {
      valid: false,
      error: `Code exceeds max size of ${MAX_CODE_SIZE} bytes`,
    };
  }

  if (Array.isArray(data.testCases) && data.testCases.some((tc) => tc.input && String(tc.input).length > MAX_INPUT_SIZE)) {
    return {
      valid: false,
      error: `Input exceeds max size of ${MAX_INPUT_SIZE} bytes`,
    };
  }

  return { valid: true, data: data as unknown as EnqueueRequest };
}

export async function handleEnqueue<TBody>(
  req: Request,
  authSecret: string,
  validateFn: (body: unknown) => { valid: boolean; error?: string; data?: TBody },
  enqueueFn: (job: TBody) => Promise<string>,
): Promise<Response> {
  const authHeader = req.headers.get("x-worker-secret");
  if (!authHeader || authHeader !== authSecret) {
    worker.warn("Unauthorized enqueue attempt");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    worker.warn("Invalid JSON in enqueue request");
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validation = validateFn(body);
  if (!validation.valid) {
    worker.warn({ error: validation.error }, "Enqueue validation failed");
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const jobId = await enqueueFn(validation.data!);
    const logData: Record<string, unknown> = { jobId };
    if (validation.data && typeof validation.data === "object" && "submissionId" in validation.data) {
      logData.submissionId = (validation.data as { submissionId: string }).submissionId;
      logData.language = (validation.data as unknown as { language: string }).language;
    }
    worker.info(logData, "Job enqueued successfully");
    return new Response(JSON.stringify({ jobId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    worker.error({ error: msg }, "Enqueue failed");
    return new Response(JSON.stringify({ error: "Failed to enqueue job" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export function handleHealth(
  getQueueLength: () => Promise<number>,
): () => Promise<Response> {
  return async () => {
    try {
      const queueLength = await getQueueLength();
      return new Response(
        JSON.stringify({ status: "ok", queueLength }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      worker.error({ error: msg }, "Health check failed");
      return new Response(
        JSON.stringify({ status: "degraded", error: msg }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }
  };
}
