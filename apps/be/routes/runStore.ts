export interface RunResult {
  runId: string;
  status: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  judgeOutput: string;
  updatedAt: number;
}

const runs = new Map<string, RunResult>();
const TTL_MS = 10 * 60 * 1000;

export function storeRunResult(
  runId: string,
  result: Omit<RunResult, "runId" | "updatedAt">,
): void {
  runs.set(runId, { ...result, runId, updatedAt: Date.now() });
}

export function getRunResult(runId: string): RunResult | undefined {
  const result = runs.get(runId);
  if (!result) return undefined;
  if (Date.now() - result.updatedAt > TTL_MS) {
    runs.delete(runId);
    return undefined;
  }
  return result;
}