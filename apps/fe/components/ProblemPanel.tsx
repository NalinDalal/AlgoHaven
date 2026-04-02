"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import type { ProblemData, SampleTestCase } from "./problemWrapper";

const DIFF: Record<string, { chip: string; label: string }> = {
  EASY: {
    chip: "bg-green-950  border border-green-900  text-green-400",
    label: "Easy",
  },
  MEDIUM: {
    chip: "bg-yellow-950 border border-yellow-900 text-yellow-400",
    label: "Medium",
  },
  HARD: {
    chip: "bg-red-950    border border-red-900    text-red-400",
    label: "Hard",
  },
};

// ─── Types for submissions ────────────────────────────────────────────────────────

interface Submission {
  id: string;
  status: string;
  language: string;
  createdAt: string;
  executionTimeMs: number | null;
}

interface Props {
  problem: ProblemData;
}

export default function ProblemPanel({ problem }: Props) {
  const [activeTab, setActiveTab] = useState<"problem" | "submissions">(
    "problem",
  );
  const ds = DIFF[problem.difficulty] ?? DIFF.MEDIUM;
  const samples = problem.testCases?.filter((tc) => tc.isSample) ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden border-r border-[#1e1e1e]">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-[#1e1e1e]">
        {(["problem", "submissions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`relative flex-1 font-mono text-[11px] uppercase tracking-[.15em] py-3 transition-all duration-150 cursor-pointer border-0 outline-none
               ${
                 activeTab === t
                   ? "bg-[#0d0d0d] text-[#e8ff47]"
                   : "bg-[#080808] text-zinc-600 hover:text-zinc-400 hover:bg-[#0b0b0b]"
               }`}
          >
            {activeTab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e8ff47]" />
            )}
            {activeTab === t ? `[ ${t} ]` : t}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "problem" ? (
          <ProblemContent problem={problem} ds={ds} samples={samples} />
        ) : (
          <SubmissionsTab problemId={problem.id} />
        )}
      </div>
    </div>
  );
}

// ─── Submissions Tab ──────────────────────────────────────────────────────────────

function SubmissionsTab({ problemId }: { problemId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/me`, {
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => {
        // Filter submissions for this problem
        const problemSubs =
          data.data?.recentSubmissions?.filter(
            (s: any) => s.problem?.id === problemId,
          ) ?? [];
        setSubmissions(problemSubs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [problemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 font-mono text-[11px] text-zinc-600">
        Loading submissions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 font-mono text-zinc-700 gap-2">
        <div className="text-[13px]">Login to view submissions</div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 font-mono text-zinc-700 gap-2 text-center px-6">
        <div className="text-2xl text-zinc-800">[ ]</div>
        <div className="text-[13px]">No submissions yet.</div>
        <div className="text-[11px] text-zinc-800">
          Submit a solution to see results here.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <div className="font-mono text-[10px] font-bold text-zinc-600 tracking-[.12em]">
        // YOUR SUBMISSIONS
      </div>
      {submissions.map((sub) => (
        <SubmissionRow key={sub.id} submission={sub} />
      ))}
    </div>
  );
}

function SubmissionRow({ submission }: { submission: Submission }) {
  const statusColors: Record<string, string> = {
    ACCEPTED: "text-green-400 border-green-900",
    WRONG_ANSWER: "text-red-400 border-red-900",
    TLE: "text-yellow-400 border-yellow-900",
    RUNTIME_ERROR: "text-orange-400 border-orange-900",
    QUEUED: "text-zinc-500 border-zinc-800",
    RUNNING: "text-blue-400 border-blue-900",
  };

  const color = statusColors[submission.status] ?? statusColors.QUEUED;
  const time = submission.executionTimeMs
    ? `${submission.executionTimeMs}ms`
    : "-";

  return (
    <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-sm p-3 flex items-center gap-3 hover:border-[#252525] transition-colors">
      <span
        className={`font-mono text-[10px] font-bold px-2 py-1 rounded border ${color}`}
      >
        {submission.status.replace("_", " ")}
      </span>
      <span className="font-mono text-[10px] text-zinc-500">
        {submission.language}
      </span>
      <span className="font-mono text-[10px] text-zinc-600 ml-auto">
        {time}
      </span>
      <span className="font-mono text-[9px] text-zinc-700">
        {new Date(submission.createdAt).toLocaleDateString()}
      </span>
    </div>
  );
}

// ─── Problem content ──────────────────────────────────────────────────────────

function ProblemContent({
  problem,
  ds,
  samples,
}: {
  problem: ProblemData;
  ds: { chip: string; label: string };
  samples: SampleTestCase[];
}) {
  const [activeSample, setActiveSample] = useState(0);

  return (
    <div className="px-6 py-5 flex flex-col gap-8">
      {/* Header with stats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-sm ${ds.chip}`}
          >
            {ds.label}
          </span>
          <span className="font-mono text-[10px] text-zinc-700">•</span>
          <span className="font-mono text-[10px] text-zinc-500">
            ID: {problem.id.slice(0, 8)}
          </span>
        </div>
        <h1 className="font-syne font-extrabold text-[clamp(1.4rem,2.5vw,1.9rem)] tracking-tight text-zinc-100 leading-tight">
          {problem.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-600">TL</span>
            <span className="text-zinc-400 bg-[#151515] border border-[#1e1e1e] px-2 py-1 rounded-sm">
              {problem.timeLimitMs}ms
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-600">ML</span>
            <span className="text-zinc-400 bg-[#151515] border border-[#1e1e1e] px-2 py-1 rounded-sm">
              {Math.round(problem.memoryLimitKb / 1024)}MB
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {problem.tags?.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] text-zinc-400 bg-[#0d0d0d] border border-[#252525] px-2.5 py-1 rounded-sm hover:border-[#e8ff47] hover:text-[#e8ff47] transition-colors cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Statement */}
      <Section label="STATEMENT">
        <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-sm p-4">
          <div className="font-mono text-[13.5px] leading-[1.8] text-zinc-300">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="text-zinc-100 font-semibold">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="text-zinc-400 italic">{children}</em>
                ),
                code: ({ children }) => (
                  <code className="bg-[#151515] border border-[#252525] px-1.5 py-0.5 rounded text-[#e8ff47] text-[12px]">
                    {children}
                  </code>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 space-y-1 text-zinc-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-1 text-zinc-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="ml-2">{children}</li>,
              }}
            >
              {problem.statement}
            </ReactMarkdown>
          </div>
        </div>
      </Section>

      {/* Constraints */}
      {problem.constraints && (
        <Section label="CONSTRAINTS">
          <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-sm p-3">
            <CopyableBlock value={problem.constraints ?? ""} as="pre" />
          </div>
        </Section>
      )}

      {/* Examples */}
      {samples.length > 0 && (
        <Section label="EXAMPLES">
          {samples.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {samples.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSample(i)}
                  className={`font-mono text-[11px] px-4 py-1.5 rounded cursor-pointer transition-all border
                    ${
                      activeSample === i
                        ? "bg-[#e8ff47] text-black font-bold border-[#e8ff47]"
                        : "bg-transparent border-[#252525] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                >
                  Example {i + 1}
                </button>
              ))}
            </div>
          )}

          <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-sm overflow-hidden">
            <div className="grid grid-cols-[48px,1fr,1fr] text-[10px] font-mono border-b border-[#1e1e1e]">
              <div className="px-3 py-2 bg-[#151515] text-zinc-600 border-r border-[#1e1e1e]">
                #
              </div>
              <div className="px-3 py-2 bg-[#151515] text-zinc-500 border-r border-[#1e1e1e]">
                INPUT
              </div>
              <div className="px-3 py-2 bg-[#151515] text-zinc-500">OUTPUT</div>
            </div>
            <div className="grid grid-cols-[48px,1fr,1fr]">
              <div className="px-3 py-2 bg-[#0f0f0f] text-zinc-700 font-mono text-[11px] border-r border-[#1e1e1e] flex items-center justify-center">
                {activeSample + 1}
              </div>
              <CopyableBlock value={samples[activeSample].input} as="pre" />
              <CopyableBlock
                value={samples[activeSample].expectedOutput}
                green
                as="pre"
              />
            </div>
          </div>
        </Section>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width:
                  problem.difficulty === "EASY"
                    ? "33%"
                    : problem.difficulty === "MEDIUM"
                      ? "66%"
                      : "100%",
                background:
                  problem.difficulty === "EASY"
                    ? "#4ade80"
                    : problem.difficulty === "MEDIUM"
                      ? "#ffd700"
                      : "#ff4d4d",
              }}
            />
          </div>
          <span className="font-mono text-[10px] text-zinc-600">
            Difficulty
          </span>
        </div>
        <div className="text-[10px] font-mono text-zinc-700">
          {samples.length} sample{samples.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-mono text-[10px] font-bold text-[#e8ff47] tracking-[.12em]">
        // {label}
      </div>
      {children}
    </div>
  );
}

// ─── Copyable block (unified IOBlock + CopyButton) ────────────────────────────

interface CopyableBlockProps {
  value: string;
  green?: boolean;
  as?: "pre" | "span";
}

function CopyableBlock({
  value,
  green,
  as: Component = "pre",
}: CopyableBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const isPre = Component === "pre";

  return (
    <div className="relative group">
      <Component
        className={`font-mono text-[13px] px-3 py-2 m-0 whitespace-pre-wrap break-all max-h-40 overflow-y-auto
          ${green ? "text-green-400" : "text-[#cdd3de]"}`}
      >
        {value}
      </Component>
      <button
        onClick={copy}
        className={`font-mono text-[10px] bg-[#1e1e1e] border border-[#2a2a2a] px-2 py-1 rounded cursor-pointer text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors
          ${isPre ? "absolute top-2 right-2 opacity-0 group-hover:opacity-100" : "ml-2"}`}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
