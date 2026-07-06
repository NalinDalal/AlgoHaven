"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { apiFetch } from "@/lib/apiFetch";

interface Problem {
    id: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    slug: string;
    tags?: string[];
    acceptance?: number;
    solved?: number;
}

const DIFF_STYLES: Record<
    string,
    { color: string; bg: string; border: string }
> = {
    Easy: {
        color: "#4ade80",
        bg: "#0d2e16",
        border: "#1a5c2d",
    },
    Medium: {
        color: "#ffd700",
        bg: "#1a1a0d",
        border: "#4a4a1a",
    },
    Hard: {
        color: "#ff4d4d",
        bg: "#2d0d0d",
        border: "#5c1a1a",
    },
};

const FILTERS = ["All", "Easy", "Medium", "Hard"] as const;
type Filter = (typeof FILTERS)[number];

export default function ProblemsPage() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>("All");
    const [search, setSearch] = useState("");
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        setLoading(true);
        apiFetch(
            `${process.env.NEXT_PUBLIC_BE_URL}/api/problems?page=${page}&limit=${limit}`,
        )
            .then((res) => res.json())
            .then((data) => {
                setProblems(data.data?.problems || []);
                if (data.data?.meta) {
                    setTotalPages(data.data.meta.totalPages);
                    setTotal(data.data.meta.total);
                }
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [page]);

    const filtered = problems.filter((p) => {
        const matchesDiff = filter === "All" || p.difficulty === filter;
        const matchesSearch =
            search === "" ||
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.id.includes(search);
        return matchesDiff && matchesSearch;
    });

    return (
        <>
            <Nav />
            <div className="min-h-screen bg-zinc-950 pt-20 text-zinc-100">
                {/* Page header */}
                <div className="border-b border-zinc-800 pb-8">
                    <div className="mx-auto max-w-[1100px] px-10">
                        <div className="mb-3 font-mono text-xs tracking-[0.12em] text-emerald-400 uppercase">
              // Problem set
                        </div>
                        <h1 className="font-bold text-5xl md:text-6xl tracking-[-0.03em] leading-none">
                            All Problems
                        </h1>

                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-3 pt-8">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[240px]">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-zinc-500 pointer-events-none">
                                    /
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by title or #id..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md pl-9 py-[9px] text-sm font-mono text-zinc-100 focus:border-emerald-400 outline-none transition-colors"
                                />
                            </div>

                            {/* Difficulty filters */}
                            <div className="flex gap-2">
                                {FILTERS.map((f) => {
                                    const isActive = filter === f;
                                    const ds = f !== "All" ? DIFF_STYLES[f] : null;

                                    return (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`font-mono text-xs font-bold px-4 py-[7px] rounded-md border transition-all ${isActive
                                                    ? "border-emerald-400 bg-emerald-950/50 text-emerald-400"
                                                    : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                                                }`}
                                            style={
                                                isActive && ds
                                                    ? {
                                                        color: ds.color,
                                                        backgroundColor: ds.bg,
                                                        borderColor: ds.border,
                                                    }
                                                    : {}
                                            }
                                        >
                                            {f}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="mx-auto max-w-[1100px] px-10 pb-16">
                    {loading ? (
                        <SkeletonTable />
                    ) : error ? (
                        <ErrorState />
                    ) : filtered.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <table className="w-full mt-2">
                            <thead>
                                <tr>
                                    {["#", "Title", "Difficulty", "Acceptance", ""].map((h) => (
                                        <th
                                            key={h}
                                            className="font-mono text-[11px] text-zinc-500 text-left py-2.5 px-4 border-b border-zinc-800 uppercase tracking-widest font-medium"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, i) => (
                                    <ProblemRow key={p.id} problem={p} index={i + 1} />
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Footer count + pagination */}
                    {!loading && !error && (
                        <div className="flex items-center justify-between font-mono text-sm text-zinc-400 mt-8 pt-4 border-t border-zinc-800">
                            <span>
                                Showing{" "}
                                <span className="text-emerald-400">
                                    {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
                                </span>{" "}
                                of {total} problems
                            </span>

                            <div className="flex items-center gap-3">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="px-4 py-1.5 border border-zinc-700 rounded-md hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    ← Prev
                                </button>
                                <span>
                                    {page} / {totalPages}
                                </span>
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-4 py-1.5 border border-zinc-700 rounded-md hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function ProblemRow({ problem, index }: { problem: Problem; index: number }) {
    const ds = DIFF_STYLES[problem.difficulty] ?? DIFF_STYLES.Medium;
    const acceptance = problem.acceptance ?? Math.floor(40 + Math.random() * 45);

    return (
        <tr
            className="group hover:bg-zinc-900/70 transition-colors cursor-pointer"
        >
            {/* Index */}
            <td className="font-mono text-sm text-zinc-500 py-4 px-4 border-b border-zinc-800 w-[60px]">
                {String(index).padStart(3, "0")}
            </td>

            {/* Title */}
            <td className="py-4 px-4 border-b border-zinc-800">
                <Link
                    href={`/problems/${problem.id}`}
                    className="font-semibold text-[15px] text-zinc-100 hover:text-emerald-400 transition-colors"
                >
                    {problem.title}
                </Link>

                {problem.tags && problem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {problem.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="font-mono text-[10px] text-zinc-500 border border-zinc-700 px-2 py-px rounded"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </td>

            {/* Difficulty */}
            <td className="py-4 px-4 border-b border-zinc-800 w-[110px]">
                <span
                    className="font-mono text-xs font-bold px-3 py-1 rounded border whitespace-nowrap"
                    style={{
                        color: ds.color,
                        backgroundColor: ds.bg,
                        borderColor: ds.border,
                    }}
                >
                    {problem.difficulty}
                </span>
            </td>

            {/* Acceptance */}
            <td className="py-4 px-4 border-b border-zinc-800 w-[160px]">
                <div className="flex items-center gap-3 font-mono text-sm">
                    <div className="flex-1 h-0.5 bg-zinc-800 rounded overflow-hidden">
                        <div
                            className="h-full rounded"
                            style={{
                                width: `${acceptance}%`,
                                backgroundColor: ds.color,
                            }}
                        />
                    </div>
                    <span className="text-zinc-400 min-w-[36px] text-right">
                        {acceptance}%
                    </span>
                </div>
            </td>

            {/* Arrow */}
            <td className="py-4 px-4 border-b border-zinc-800 w-10 text-right">
                <Link
                    href={`/problems/${problem.slug || problem.id}`}
                    className="font-mono text-sm text-zinc-400 group-hover:text-emerald-400 transition-colors"
                >
                    →
                </Link>
            </td>
        </tr>
    );
}

/* Skeleton */
function SkeletonTable() {
    return (
        <div className="mt-2 space-y-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="h-14 border-b border-zinc-800 flex items-center gap-4 px-4 animate-pulse"
                >
                    <div className="w-10 h-2.5 bg-zinc-800 rounded" />
                    <div className="flex-1 h-2.5 bg-zinc-800 rounded" />
                    <div className="w-16 h-2.5 bg-zinc-800 rounded" />
                </div>
            ))}
        </div>
    );
}

/* Empty State */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400 font-mono">
            <div className="text-4xl mb-4 text-zinc-700">{"{ }"}</div>
            <div className="text-sm">No problems match your filters.</div>
            <div className="text-xs mt-2 text-zinc-600">
                Try a different search or difficulty.
            </div>
        </div>
    );
}

/* Error State */
function ErrorState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="font-mono text-sm border border-red-900 bg-red-950/50 text-red-400 px-6 py-3 rounded">
                Error: Could not reach judge server. Is the backend running?
            </div>
        </div>
    );
}
