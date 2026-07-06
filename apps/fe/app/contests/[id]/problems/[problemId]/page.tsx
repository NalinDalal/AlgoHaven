"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import ProblemPanel from "@/components/ProblemPanel";
import EditorPanel from "@/components/EditorPanel";
import { apiFetch } from "@/lib/apiFetch";
import type { ProblemData, SampleTestCase } from "@/components/problemWrapper";

interface ContestProblemResponse {
    problem: {
        id: string;
        index: string;
        points: number;
        userStatus: "solved" | "unsolved";
        solvedAt: string | null;
        problem: {
            id: string;
            title: string;
            slug: string;
            difficulty: "EASY" | "MEDIUM" | "HARD";
            statement: string;
            tags: string[];
            timeLimitMs: number;
            memoryLimitKb: number;
            testCases: {
                id: string;
                input: string;
                expectedOutput: string;
            }[];
        };
    };
}

const DIFF_STYLES: Record<string, { chip: string; label: string }> = {
    EASY: { chip: "bg-green-950 border border-green-900 text-green-400", label: "Easy" },
    MEDIUM: { chip: "bg-yellow-950 border border-yellow-900 text-yellow-400", label: "Medium" },
    HARD: { chip: "bg-red-950 border border-red-900 text-red-400", label: "Hard" },
};

export default function ContestProblemPage() {
    const { id: contestId, problemId } = useParams<{
        id: string;
        problemId: string;
    }>();
    const searchParams = useSearchParams();
    const isVirtual = searchParams.get("virtual") === "1";
    const router = useRouter();
    const [problem, setProblem] = useState<ProblemData | null>(null);
    const [contestInfo, setContestInfo] = useState<{
        index: string;
        points: number;
        userStatus: "solved" | "unsolved";
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!contestId || !problemId) return;

        apiFetch(
            `${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${contestId}/problems/${problemId}`,
            { credentials: "include" },
        )
            .then((res) => {
                if (res.status === 401 || res.status === 403) {
                    router.replace(
                        `/auth?redirect=/contests/${contestId}/problems/${problemId}`,
                    );
                    return;
                }
                if (!res.ok) throw new Error("not_found");
                return res.json();
            })
            .then((d) => {
                if (!d) return;
                const cp: ContestProblemResponse["problem"] = d.data.problem;
                const p = cp.problem;

                const samples: SampleTestCase[] = p.testCases.map((tc) => ({
                    id: tc.id,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    isSample: true as const,
                    points: 0,
                }));

                setProblem({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    difficulty: p.difficulty,
                    statement: p.statement,
                    tags: p.tags,
                    timeLimitMs: p.timeLimitMs,
                    memoryLimitKb: p.memoryLimitKb,
                    testCases: samples,
                });

                setContestInfo({
                    index: cp.index,
                    points: cp.points,
                    userStatus: cp.userStatus,
                });
            })
            .catch((e) => {
                if (e.message !== "not_found") {
                    setError("Failed to load problem");
                } else {
                    setError("Problem not found in this contest");
                }
            })
            .finally(() => setLoading(false));
    }, [contestId, problemId, router]);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorState error={error} />;
    if (!problem || !contestInfo) return null;

    const ds = DIFF_STYLES[problem.difficulty] ?? DIFF_STYLES.MEDIUM;
    const letter = String.fromCharCode(
        65 + (contestInfo.index.charCodeAt(0) - 65),
    );

    return (
        <>
            <Nav />
            <div className="min-h-screen bg-[#0a0a0a] overflow-hidden pt-[70px]">
                {/* Contest-aware breadcrumb */}
                <div className="border-b border-[#1e1e1e] px-5 h-10 flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs text-[#666]">
                    <Link
                        href={isVirtual ? `/contests/${contestId}/virtual` : `/contests/${contestId}`}
                        className="text-[#666] no-underline transition-colors duration-[120ms] hover:text-[var(--accent)]"
                    >
                        {isVirtual ? "← Virtual" : "← Contest"}
                    </Link>
                    <span className="text-[#2e2e2e]">/</span>
                    <span className="text-[#f0f0f0] max-w-[300px] truncate">
                        {letter}. {problem.title}
                    </span>
                    <span className={`${ds.chip} text-[10px] font-bold px-2 py-0.5`}>
                        {ds.label}
                    </span>
                    <span className="text-[11px] text-[#666] ml-1">
                        {contestInfo.points} pts
                    </span>
                    {contestInfo.userStatus === "solved" && (
                        <span className="text-[10px] font-bold text-[#4ade80] bg-[#0d2e16] border border-[#1a5c2d] px-2 py-0.5 rounded-sm ml-auto">
                            Solved
                        </span>
                    )}
                    <div className="ml-auto flex gap-4 text-[11px] text-[#333]">
                        <span>TL: {problem.timeLimitMs}ms</span>
                        <span>ML: {Math.round(problem.memoryLimitKb / 1024)}MB</span>
                    </div>
                </div>

                {/* Split pane */}
                <div className="grid grid-cols-2 overflow-hidden h-[calc(100vh-110px)]">
                    <ProblemPanel problem={problem} />
                    <EditorPanel
                        problemId={problem.id}
                        samples={problem.testCases}
                        submitEndpoint={`${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${contestId}/problems/${problemId}`}
                    />
                </div>
            </div>
        </>
    );
}

function LoadingSkeleton() {
    return (
        <>
            <Nav />
            <div className="min-h-screen bg-[#0a0a0a] pt-[70px]">
                <div className="h-10 border-b border-[#1e1e1e] flex items-center px-5 gap-2">
                    <div className="w-20 h-2.5 bg-[#111] rounded-sm animate-pulse" />
                    <div className="w-[120px] h-2.5 bg-[#111] rounded-sm animate-pulse [animation-delay:0.1s]" />
                </div>
                <div className="grid grid-cols-2 h-[calc(100vh-110px)]">
                    <div className="border-r border-[#1e1e1e] p-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-[14px] bg-[#111] rounded-sm mb-3 animate-pulse"
                                style={{
                                    width: `${70 + i * 5}%`,
                                    animationDelay: `${i * 0.05}s`,
                                }}
                            />
                        ))}
                    </div>
                    <div className="p-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-[14px] bg-[#111] rounded-sm mb-3 animate-pulse"
                                style={{
                                    width: `${60 + i * 8}%`,
                                    animationDelay: `${i * 0.05}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

function ErrorState({ error }: { error: string }) {
    return (
        <>
            <Nav />
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-[family-name:var(--font-mono)]">
                <div className="text-[13px] text-[#ff4d4d] border border-[#5c1a1a] bg-[#2d0d0d] px-6 py-3 rounded-sm">
                    {error === "Problem not found in this contest"
                        ? "404 · Problem not found in this contest"
                        : "Error loading problem"}
                </div>
            </div>
        </>
    );
}
