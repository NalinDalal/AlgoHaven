"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import type { ProblemData, SampleTestCase } from "./problemWrapper";
import { apiFetch } from "@/lib/apiFetch";

const DIFF: Record<string, { chip: string; label: string }> = {
    EASY: {
        chip: "bg-green-950 border border-green-900 text-green-400",
        label: "Easy",
    },
    MEDIUM: {
        chip: "bg-yellow-950 border border-yellow-900 text-yellow-400",
        label: "Medium",
    },
    HARD: {
        chip: "bg-red-950 border border-red-900 text-red-400",
        label: "Hard",
    },
};

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
    const [activeTab, setActiveTab] = useState<"problem" | "submissions">("problem");
    const ds = DIFF[problem.difficulty] ?? DIFF.MEDIUM;
    const samples = problem.testCases?.filter((tc) => tc.isSample) ?? [];

    return (
        <div className="flex flex-col h-full overflow-hidden border-r border-zinc-900">
            {/* Tab bar */}
            <div className="flex shrink-0 border-b border-zinc-900">
                {(["problem", "submissions"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`relative flex-1 font-mono text-xs uppercase tracking-widest py-3.5 transition-all duration-150 border-0 outline-none
              ${activeTab === t
                                ? "bg-zinc-950 text-emerald-400"
                                : "bg-zinc-950/70 text-zinc-500 hover:text-zinc-400"
                            }`}
                    >
                        {activeTab === t && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
                        )}
                        {activeTab === t ? `[ ${t} ]` : t}
                    </button>
                ))}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto bg-zinc-950">
                {activeTab === "problem" ? (
                    <ProblemContent problem={problem} ds={ds} samples={samples} />
                ) : (
                    <SubmissionsTab problemId={problem.id} />
                )}
            </div>
        </div>
    );
}

/* ==================== Submissions Tab ==================== */

function SubmissionsTab({ problemId }: { problemId: string }) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/me`, {
            credentials: "include",
        })
            .then((r) => {
                if (!r.ok) throw new Error("Not authenticated");
                return r.json();
            })
            .then((data) => {
                const problemSubs =
                    data.data?.recentSubmissions?.filter(
                        (s: any) => s.problem?.id === problemId
                    ) ?? [];
                setSubmissions(problemSubs);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [problemId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32 font-mono text-xs text-zinc-500">
                Loading submissions...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-32 font-mono text-zinc-600 gap-2">
                <div className="text-sm">Login to view submissions</div>
            </div>
        );
    }

    if (submissions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 font-mono text-zinc-600 gap-3 text-center px-6">
                <div className="text-4xl text-zinc-800">[ ]</div>
                <div className="text-sm">No submissions yet.</div>
                <div className="text-xs text-zinc-700">
                    Submit a solution to see results here.
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 py-6 flex flex-col gap-3">
            <div className="font-mono text-[10px] font-bold text-zinc-500 tracking-widest">
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
        <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-md p-4 flex items-center gap-4 transition-colors">
            <span className={`font-mono text-xs font-bold px-3 py-1 rounded border ${color}`}>
                {submission.status.replace("_", " ")}
            </span>
            <span className="font-mono text-xs text-zinc-500">
                {submission.language}
            </span>
            <span className="font-mono text-xs text-zinc-600 ml-auto">
                {time}
            </span>
            <span className="font-mono text-[10px] text-zinc-700">
                {new Date(submission.createdAt).toLocaleDateString()}
            </span>
        </div>
    );
}

/* ==================== Problem Content ==================== */

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
        <div className="px-8 py-8 flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className={`font-mono text-xs font-bold px-3 py-1 rounded-sm ${ds.chip}`}>
                        {ds.label}
                    </span>
                    <span className="font-mono text-xs text-zinc-700">•</span>
                    <span className="font-mono text-xs text-zinc-500">
                        ID: {problem.id.slice(0, 8)}
                    </span>
                </div>

                <h1 className="font-bold text-[clamp(1.5rem,2.5vw,2.1rem)] tracking-tight leading-tight text-zinc-100">
                    {problem.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500">TL</span>
                        <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded text-zinc-300">
                            {problem.timeLimitMs}ms
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500">ML</span>
                        <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded text-zinc-300">
                            {Math.round(problem.memoryLimitKb / 1024)}MB
                        </span>
                    </div>
                </div>
            </div>

            {/* Tags */}
            {problem.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag) => (
                        <span
                            key={tag}
                            className="font-mono text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded hover:border-emerald-400 hover:text-emerald-400 transition-colors cursor-default"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Statement */}
            <Section label="STATEMENT">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <div className="font-mono text-[13.5px] leading-relaxed text-zinc-300 prose-zinc">
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="text-zinc-100 font-semibold">{children}</strong>,
                                em: ({ children }) => <em className="text-zinc-400 italic">{children}</em>,
                                code: ({ children }) => (
                                    <code className="bg-zinc-950 border border-zinc-700 px-1.5 py-0.5 rounded text-emerald-400 text-sm">
                                        {children}
                                    </code>
                                ),
                                ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
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
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                        <CopyableBlock value={problem.constraints} as="pre" />
                    </div>
                </Section>
            )}

            {/* Examples */}
            {samples.length > 0 && (
                <Section label="EXAMPLES">
                    {samples.length > 1 && (
                        <div className="flex gap-2 flex-wrap mb-4">
                            {samples.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveSample(i)}
                                    className={`font-mono text-xs px-5 py-2 rounded transition-all border ${activeSample === i
                                            ? "bg-emerald-400 text-black font-bold border-emerald-400"
                                            : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                        }`}
                                >
                                    Example {i + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[48px,1fr,1fr] text-xs font-mono border-b border-zinc-800">
                            <div className="px-4 py-3 bg-zinc-950 text-zinc-500 border-r border-zinc-800">#</div>
                            <div className="px-4 py-3 bg-zinc-950 text-zinc-500 border-r border-zinc-800">INPUT</div>
                            <div className="px-4 py-3 bg-zinc-950 text-zinc-500">OUTPUT</div>
                        </div>
                        <div className="grid grid-cols-[48px,1fr,1fr]">
                            <div className="px-4 py-4 bg-zinc-950 text-zinc-600 font-mono text-sm border-r border-zinc-800 flex items-center justify-center">
                                {activeSample + 1}
                            </div>
                            <CopyableBlock value={samples[activeSample].input} as="pre" />
                            <CopyableBlock value={samples[activeSample].expectedOutput} green as="pre" />
                        </div>
                    </div>
                </Section>
            )}

            {/* Footer */}
            <div className="flex items-center gap-6 pt-6 border-t border-zinc-800 text-xs font-mono text-zinc-500">
                <div className="flex items-center gap-3">
                    <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: problem.difficulty === "EASY" ? "33%" : problem.difficulty === "MEDIUM" ? "66%" : "100%",
                                background: problem.difficulty === "EASY" ? "#4ade80" : problem.difficulty === "MEDIUM" ? "#ffd700" : "#ff4d4d",
                            }}
                        />
                    </div>
                    <span>Difficulty</span>
                </div>
                <div>
                    {samples.length} sample{samples.length !== 1 ? "s" : ""}
                </div>
            </div>
        </div>
    );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3">
            <div className="font-mono text-xs font-bold text-emerald-400 tracking-widest">
        // {label}
            </div>
            {children}
        </div>
    );
}

interface CopyableBlockProps {
    value: string;
    green?: boolean;
    as?: "pre" | "span";
}

function CopyableBlock({ value, green, as: Component = "pre" }: CopyableBlockProps) {
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
                className={`font-mono text-sm px-4 py-3 m-0 whitespace-pre-wrap break-all max-h-44 overflow-y-auto
          ${green ? "text-emerald-400" : "text-zinc-300"}`}
            >
                {value}
            </Component>

            <button
                onClick={copy}
                className={`font-mono text-[10px] bg-zinc-950 border border-zinc-700 px-3 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all
          ${isPre ? "absolute top-3 right-3 opacity-0 group-hover:opacity-100" : "ml-3"}`}
            >
                {copied ? "Copied!" : "Copy"}
            </button>
        </div>
    );
}
