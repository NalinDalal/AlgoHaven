import { MAX_CODE_SIZE, MAX_INPUT_SIZE } from "./config";

export interface EnqueueRequest {
    submissionId: string;
    code: string;
    language: string;
    testCases: { input: string; expectedOutput: string }[];
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

export async function handleEnqueue(
    req: Request,
    authSecret: string,
    enqueueFn: (job: {
        submissionId: string;
        code: string;
        language: string;
        testCases: { input: string; expectedOutput: string }[];
    }) => void,
): Promise<Response> {
    const authHeader = req.headers.get("x-worker-secret");
    if (!authHeader || authHeader !== authSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
        });
    }

    const validation = validateEnqueueRequest(body);
    if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
            status: 400,
        });
    }

    enqueueFn(validation.data!);
    return new Response(JSON.stringify({ message: "Job enqueued" }), {
        status: 200,
    });
}

export function handleHealth(getQueueLength: () => number): () => Response {
    return () =>
        new Response(
            JSON.stringify({
                status: "ok",
                queueLength: getQueueLength(),
            }),
            { headers: { "Content-Type": "application/json" } },
        );
}
