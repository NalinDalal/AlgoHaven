"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import ProblemPanel from "./ProblemPanel";
import EditorPanel from "./EditorPanel";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SampleTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: true;
  points: number;
}

export interface ProblemData {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  statement: string;
  constraints?: string;
  tags: string[];
  timeLimitMs: number;
  memoryLimitKb: number;
  testCases: SampleTestCase[];
}

export type SubmissionStatus =
  | "QUEUED" | "RUNNING" | "ACCEPTED" | "WRONG_ANSWER"
  | "TLE" | "MLE" | "RUNTIME_ERROR" | "COMPILE_ERROR";

export interface SubmissionResult {
  id: string;
  status: SubmissionStatus;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  compilerOutput?: string;
  judgeOutput?: string;
  points?: number;
}

export type Lang = "cpp" | "python" | "java" | "javascript";

const DIFF_STYLES: Record<string, { chip: string; label: string }> = {
  EASY:   { chip: "bg-green-950  border border-green-900  text-green-400",  label: "Easy"   },
  MEDIUM: { chip: "bg-yellow-950 border border-yellow-900 text-yellow-400", label: "Medium" },
  HARD:   { chip: "bg-red-950    border border-red-900    text-red-400",    label: "Hard"   },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProblemWrapperProps {
  problem: ProblemData;
  submitEndpoint?: string;
  onVerdict?: (result: SubmissionResult) => void;
}

// ─── Wrapper ─────────────────────────────────────────────────────────────────

export default function ProblemWrapper({ problem, submitEndpoint, onVerdict }: ProblemWrapperProps) {
  const ds = DIFF_STYLES[problem.difficulty] ?? DIFF_STYLES.MEDIUM;
  const samples = problem.testCases?.filter((tc) => tc.isSample) ?? [];

  return (
    <>
      <Nav />
      <div
        className="flex flex-col bg-[#0a0a0a] overflow-hidden"
        style={{ minHeight: "100vh", paddingTop: 70 }}
      >
        {/* Breadcrumb */}
        <div className="border-b border-[#1e1e1e] px-5 h-10 flex items-center gap-2 shrink-0 font-mono text-xs text-zinc-500">
          <Link href="/problems" className="hover:text-[#e8ff47] transition-colors">
            Problems
          </Link>
          <span className="text-[#2e2e2e]">/</span>
          <span className="text-zinc-200 max-w-xs truncate">{problem.title}</span>
          <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-sm ${ds.chip}`}>
            {ds.label}
          </span>
          <div className="ml-auto flex gap-4 text-[11px] text-zinc-700">
            <span>TL: {problem.timeLimitMs}ms</span>
            <span>ML: {Math.round(problem.memoryLimitKb / 1024)}MB</span>
          </div>
        </div>

        {/* Split pane */}
        <div
          className="flex-1 grid grid-cols-2 overflow-hidden"
          style={{ height: "calc(100vh - 110px)" }}
        >
          <ProblemPanel problem={problem} />
          <EditorPanel
            problemId={problem.id}
            samples={samples}
            submitEndpoint={submitEndpoint}
            onVerdict={onVerdict}
          />
        </div>
      </div>
    </>
  );
}