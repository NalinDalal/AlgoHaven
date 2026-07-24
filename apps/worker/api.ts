import { MAX_CODE_SIZE, MAX_INPUT_SIZE } from "./config";
import { worker } from "@algohaven/logger";

export interface EnqueueRequest {
  submissionId: string;
  code: string;
  language: string;
  testCases: { input: string; expectedOutput: string }[];
  judgePhase: string;
}

export function validateEnqueueRequest(body: unknown): {
  valid: boolean;
  error?: string;
  data?: EnqueueRequest;
} {
  const data = body as EnqueueRequest;

  if (!data.submissionId || !data.code || !data.language) {
    return { valid: false, error: "submissionId, code, and language required" };
  }

  if (data.code.length > MAX_CODE_SIZE) {
    return {
      valid: false,
      error: `Code exceeds max size of ${MAX_CODE_SIZE} bytes`,
    };
  }

  if (data.testCases?.some((tc) => tc.input?.length > MAX_INPUT_SIZE)) {
    return {
      valid: false,
      error: `Input exceeds max size of ${MAX_INPUT_SIZE} bytes`,
    };
  }

  return { valid: true, data };
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
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    worker.warn("Invalid JSON in enqueue request");
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const validation = validateFn(body);
  if (!validation.valid) {
    worker.warn({ error: validation.error }, "Enqueue validation failed");
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
    });
  }

  const jobId = await enqueueFn(validation.data!);
  const logData: Record<string, unknown> = { jobId };
  if (validation.data && typeof validation.data === "object" && "submissionId" in validation.data) {
    logData.submissionId = (validation.data as { submissionId: string }).submissionId;
    logData.language = (validation.data as unknown as { language: string }).language;
  }
  worker.info(logData, "Job enqueued successfully");
  return new Response(JSON.stringify({ jobId }), {
    status: 200,
  });
}

export function handleHealth(
  getQueueLength: () => Promise<number>,
): () => Promise<Response> {
  return async () =>
    new Response(
      JSON.stringify({
        status: "ok",
        queueLength: await getQueueLength(),
      }),
      { headers: { "Content-Type": "application/json" } },
    );
}
