"use client";

import type { SubmissionResult, SubmissionStatus } from "./problemWrapper";

const STATUS: Record<SubmissionStatus, { chip: string; dot: string; label: string; live: boolean }> = {
  QUEUED:        { chip: "bg-zinc-900 border border-zinc-700 text-zinc-400",         dot: "bg-zinc-400",   label: "In Queue",              live: true  },
  RUNNING:       { chip: "bg-yellow-950 border border-yellow-900 text-yellow-400",   dot: "bg-yellow-400", label: "Running...",             live: true  },
  ACCEPTED:      { chip: "bg-green-950 border border-green-900 text-green-400",      dot: "bg-green-400",  label: "Accepted",              live: false },
  WRONG_ANSWER:  { chip: "bg-red-950 border border-red-900 text-red-400",            dot: "bg-red-400",    label: "Wrong Answer",          live: false },
  TLE:           { chip: "bg-yellow-950 border border-yellow-900 text-yellow-400",   dot: "bg-yellow-400", label: "Time Limit Exceeded",   live: false },
  MLE:           { chip: "bg-blue-950 border border-blue-900 text-blue-400",         dot: "bg-blue-400",   label: "Memory Limit Exceeded", live: false },
  RUNTIME_ERROR: { chip: "bg-orange-950 border border-orange-900 text-orange-400",   dot: "bg-orange-400", label: "Runtime Error",         live: false },
  COMPILE_ERROR: { chip: "bg-purple-950 border border-purple-900 text-purple-400",   dot: "bg-purple-400", label: "Compile Error",         live: false },
};

interface Props {
  result: SubmissionResult | null;
  judgeMsg: string;
  submitting: boolean;
}

export default function JudgeStatusBadge({ result, judgeMsg, submitting }: Props) {
  if (submitting && !result) {
    return (
      <span className="font-mono text-[11px] text-zinc-500 flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e8ff47] animate-pulse" />
        {judgeMsg || "Submitting..."}
      </span>
    );
  }
  if (!result) return null;

  const s = STATUS[result.status];
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-[11px] font-bold px-3 py-1 rounded-sm flex items-center gap-1.5 ${s.chip}`}>
        {s.live && <span className={`inline-block w-1 h-1 rounded-full ${s.dot} animate-pulse`} />}
        {judgeMsg || s.label}
      </span>
      {result.status === "ACCEPTED" && result.executionTimeMs != null && (
        <span className="font-mono text-[11px] text-zinc-600">
          {Math.round(result.executionTimeMs)}ms
          {result.memoryUsedKb != null &&
            ` · ${(Math.round(result.memoryUsedKb / 1024 * 10) / 10).toFixed(1)}MB`}
        </span>
      )}
    </div>
  );
}