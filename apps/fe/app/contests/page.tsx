"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { apiFetch } from "@/lib/apiFetch";

interface Contest {
    id: string;
    title: string;
    slug: string;
    startTime: string;
    endTime: string;
    visibility: "PUBLIC" | "INVITE" | "PRIVATE";
    isRated: boolean;
    isPractice: boolean;
    registrationOpen: boolean;
    status: "upcoming" | "live" | "past";
    participantCount: number;
    problemCount: number;
}

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
    upcoming: { cls: "text-[var(--blue)] bg-[#0d1a2d] border-[#1a3a6e]", label: "Upcoming" },
    live: { cls: "text-[var(--code-green)] bg-[#0d2e16] border-[#1a5c2d]", label: "Live" },
    past: { cls: "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]", label: "Past" },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ContestsPage() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        setLoading(true);
        apiFetch(
            `${process.env.NEXT_PUBLIC_BE_URL}/api/contest?page=${page}&limit=${limit}`,
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success") {
                    setContests(data.data.contests || []);
                    if (data.data?.meta) {
                        setTotalPages(data.data.meta.totalPages);
                        setTotal(data.data.meta.total);
                    }
                }
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [page]);

    return (
        <>
            <Nav />
            <div className="min-h-screen bg-[var(--bg)] pt-[80px]">
                {/* Page header */}
                <div className="border-b border-[var(--border)] px-10 pt-10 max-w-[1100px] mx-auto">
                    <div className="font-[family-name:var(--font-mono)] text-xs text-[var(--accent)] tracking-[.12em] uppercase mb-3">
            // Contests
                    </div>
                    <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-[-.03em] leading-none text-[var(--text)] mb-8">
                        All Contests
                    </h1>
                </div>

                {/* Table */}
                <div className="max-w-[1100px] mx-auto px-10 pb-16">
                    {loading ? (
                        <SkeletonTable />
                    ) : error ? (
                        <ErrorState />
                    ) : contests.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <table className="w-full border-collapse mt-2">
                            <thead>
                                <tr>
                                    {["Title", "Status", "Duration", "Problems", "Participants", ""].map(
                                        (h) => (
                                            <th
                                                key={h}
                                                className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)] text-left px-4 py-2.5 border-b border-[var(--border)] tracking-[.06em] uppercase font-medium"
                                            >
                                                {h}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {contests.map((c) => (
                                    <ContestRow key={c.id} contest={c} />
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {!loading && !error && totalPages > 1 && (
                        <div className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)] mt-6 border-t border-[var(--border)] pt-4 flex justify-between items-center">
                            <span>
                                Page <span className="text-[var(--accent)]">{page}</span> of{" "}
                                {totalPages} ({total} contests)
                            </span>
                            <div className="flex gap-2 items-center">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className={`font-[family-name:var(--font-mono)] text-xs px-3 py-1.5 rounded-sm border border-[var(--border)] bg-transparent ${page <= 1
                                            ? "text-[#333] cursor-not-allowed"
                                            : "text-[var(--muted)] cursor-pointer"
                                        }`}
                                >
                                    ← Prev
                                </button>
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className={`font-[family-name:var(--font-mono)] text-xs px-3 py-1.5 rounded-sm border border-[var(--border)] bg-transparent ${page >= totalPages
                                            ? "text-[#333] cursor-not-allowed"
                                            : "text-[var(--muted)] cursor-pointer"
                                        }`}
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

function ContestRow({ contest }: { contest: Contest }) {
    const ss = STATUS_STYLES[contest.status] ?? STATUS_STYLES.past;
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return (
        <tr className="transition-colors duration-[120ms] cursor-pointer hover:bg-[var(--surface)]">
            {/* Title */}
            <td className="px-4 py-3.5 border-b border-[var(--border)]">
                <Link
                    href={`/contests/${contest.id}`}
                    className="font-[family-name:var(--font-syne)] font-semibold text-[15px] text-[var(--text)] no-underline transition-colors duration-[120ms] hover:text-[var(--accent)]"
                >
                    {contest.title}
                </Link>
                <div className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)] mt-0.5">
                    {formatDate(contest.startTime)}
                </div>
            </td>

            {/* Status */}
            <td className="px-4 py-3.5 border-b border-[var(--border)] w-[110px]">
                <div className="flex gap-1.5 items-center">
                    <span
                        className={`font-[family-name:var(--font-mono)] text-[11px] font-bold px-2.5 py-[3px] rounded-sm border whitespace-nowrap ${ss.cls}`}
                    >
                        {ss.label}
                    </span>
                    {contest.isPractice && (
                        <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold text-[#a78bfa] bg-[#1a0d2e] border border-[#3a1a6e] px-2 py-0.5 rounded-sm whitespace-nowrap">
                            Virtual
                        </span>
                    )}
                </div>
            </td>

            {/* Duration */}
            <td className="px-4 py-3.5 border-b border-[var(--border)] font-[family-name:var(--font-mono)] text-xs text-[var(--muted)] w-[100px]">
                {durationStr}
            </td>

            {/* Problems */}
            <td className="px-4 py-3.5 border-b border-[var(--border)] font-[family-name:var(--font-mono)] text-xs text-[var(--muted)] w-[90px]">
                {contest.problemCount}
            </td>

            {/* Participants */}
            <td className="px-4 py-3.5 border-b border-[var(--border)] font-[family-name:var(--font-mono)] text-xs text-[var(--muted)] w-[110px]">
                {contest.participantCount}
            </td>

            {/* Arrow */}
            <td className="px-4 py-3.5 border-b border-[var(--border)] w-10 text-right">
                <Link
                    href={`/contests/${contest.id}`}
                    className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--muted)] no-underline transition-colors duration-[120ms] hover:text-[var(--accent)]"
                >
                    →
                </Link>
            </td>
        </tr>
    );
}

function SkeletonTable() {
    return (
        <div className="mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="h-14 border-b border-[var(--border)] flex items-center gap-4 px-4"
                >
                    <div className="flex-1 h-2.5 bg-[var(--surface)] rounded-sm animate-pulse" />
                    <div
                        className="w-[70px] h-2.5 bg-[var(--surface)] rounded-sm animate-pulse"
                        style={{ animationDelay: `${i * 0.05}s` }}
                    />
                    <div className="w-[50px] h-2.5 bg-[var(--surface)] rounded-sm animate-pulse" />
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-8 font-[family-name:var(--font-mono)] text-[var(--muted)] text-center">
            <div className="text-[32px] mb-4 text-[var(--border-lit)]">
                {"{ }"}
            </div>
            <div className="text-sm">No contests yet.</div>
            <div className="text-xs mt-1.5 text-[#333]">
                Check back later for upcoming contests.
            </div>
        </div>
    );
}

function ErrorState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-8 font-[family-name:var(--font-mono)] text-[var(--muted)] text-center">
            <div className="text-[13px] text-[#ff4d4d] border border-[#5c1a1a] bg-[#2d0d0d] px-5 py-2.5 rounded-sm">
                Error loading contests. Is the backend running?
            </div>
        </div>
    );
}
