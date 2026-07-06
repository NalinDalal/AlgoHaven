"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    status?: "upcoming" | "live" | "past";
    participantCount?: number;
    problemCount?: number;
}

const STATUS_BADGE: Record<
    "upcoming" | "live" | "past",
    { cls: string; text: string }
> = {
    upcoming: { cls: "bg-[#1a1a2e] text-[#60a5fa]", text: "Upcoming" },
    live: { cls: "bg-[#0d2818] text-[#22c55e]", text: "Live" },
    past: { cls: "bg-[#1a1a1a] text-[#888]", text: "Past" },
};

const TH_CLASS =
    "px-4 py-3 text-left font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--muted)] uppercase tracking-[.06em] bg-[#0d0d0d]";
const TD_CLASS = "px-4 py-3.5 align-middle";

export default function AdminContestsPage() {
    const router = useRouter();
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        apiFetch(
            `${process.env.NEXT_PUBLIC_BE_URL}/api/contest?page=${page}&limit=${limit}`,
            { credentials: "include" },
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success") {
                    setContests(data.data.contests);
                    if (data.data?.meta) {
                        setTotalPages(data.data.meta.totalPages);
                        setTotal(data.data.meta.total);
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page]);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete contest "${title}"? This cannot be undone.`)) return;

        setDeleting(id);
        try {
            const res = await apiFetch(
                `${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${id}`,
                {
                    method: "DELETE",
                    headers: { "X-Requested-By": "AlgoHaven" },
                    credentials: "include",
                },
            );
            const data = await res.json();
            if (data.status === "success") {
                setContests(contests.filter((c) => c.id !== id));
            } else {
                alert(data.message || "Failed to delete");
            }
        } catch (err) {
            alert("Failed to delete");
        } finally {
            setDeleting(null);
        }
    };

    const getStatusBadge = (contest: Contest) => {
        const now = new Date();
        const start = new Date(contest.startTime);
        const end = new Date(contest.endTime);

        let status: "upcoming" | "live" | "past" = "past";
        if (now < start) status = "upcoming";
        else if (now <= end) status = "live";

        const badge = STATUS_BADGE[status];

        return (
            <span
                className={`inline-block px-2 py-1 rounded-sm text-[11px] font-bold font-[family-name:var(--font-mono)] ${badge.cls}`}
            >
                {badge.text}
            </span>
        );
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-[var(--muted)] font-[family-name:var(--font-mono)]">
                Loading contests...
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Link
                        href="/admin"
                        className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)] no-underline mb-2 inline-block"
                    >
                        ← Back to Dashboard
                    </Link>
                    <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[1.75rem] text-[var(--text)] m-0">
                        Contests
                    </h1>
                </div>
                <Link
                    href="/admin/contests/new"
                    className="bg-[var(--accent)] text-black px-5 py-2.5 rounded-sm font-[family-name:var(--font-mono)] text-[13px] font-bold no-underline"
                >
                    + New Contest
                </Link>
            </div>

            {contests.length === 0 ? (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded text-center p-16">
                    <div className="font-[family-name:var(--font-mono)] text-[32px] mb-4">
                        🏆
                    </div>
                    <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--muted)] mb-6">
                        No contests yet
                    </p>
                    <Link
                        href="/admin/contests/new"
                        className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--accent)]"
                    >
                        Create your first contest →
                    </Link>
                </div>
            ) : (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className={TH_CLASS}>Title</th>
                                <th className={`${TH_CLASS} w-[120px]`}>Status</th>
                                <th className={`${TH_CLASS} w-[120px]`}>Visibility</th>
                                <th className={`${TH_CLASS} w-[100px]`}>Rated</th>
                                <th className={`${TH_CLASS} w-[80px]`}>Problems</th>
                                <th className={`${TH_CLASS} w-[80px]`}>Participants</th>
                                <th className={`${TH_CLASS} w-[100px]`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contests.map((contest) => (
                                <tr
                                    key={contest.id}
                                    className="border-b border-[var(--border-lit)]"
                                >
                                    <td className={TD_CLASS}>
                                        <div>
                                            <span className="font-[family-name:var(--font-mono)] text-[13px] font-semibold text-[var(--text)]">
                                                {contest.title}
                                            </span>
                                            <div className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)] mt-0.5">
                                                {formatDate(contest.startTime)} -{" "}
                                                {formatDate(contest.endTime)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={TD_CLASS}>{getStatusBadge(contest)}</td>
                                    <td className={TD_CLASS}>
                                        <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                                            {contest.visibility}
                                        </span>
                                    </td>
                                    <td className={TD_CLASS}>
                                        <span
                                            className={`font-[family-name:var(--font-mono)] text-[11px] ${contest.isRated
                                                    ? "text-[var(--code-green)]"
                                                    : "text-[var(--muted)]"
                                                }`}
                                        >
                                            {contest.isRated ? "Yes" : "No"}
                                        </span>
                                    </td>
                                    <td className={TD_CLASS}>
                                        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                                            {contest.problemCount ?? 0}
                                        </span>
                                    </td>
                                    <td className={TD_CLASS}>
                                        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                                            {contest.participantCount ?? 0}
                                        </span>
                                    </td>
                                    <td className={TD_CLASS}>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/admin/contests/${contest.id}`}
                                                className="px-2 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--accent)] no-underline"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(contest.id, contest.title)}
                                                disabled={deleting === contest.id}
                                                className={`px-2 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--red)] bg-transparent border-none ${deleting === contest.id
                                                        ? "cursor-not-allowed opacity-50"
                                                        : "cursor-pointer opacity-100"
                                                    }`}
                                            >
                                                {deleting === contest.id ? "..." : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-4 mt-6 font-[family-name:var(--font-mono)] text-xs">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className={`px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-sm font-[family-name:var(--font-mono)] text-xs ${page === 1
                                ? "text-[var(--muted)] cursor-not-allowed"
                                : "text-[var(--text)] cursor-pointer"
                            }`}
                    >
                        ← Prev
                    </button>
                    <span className="text-[var(--muted)] p-2">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className={`px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-sm font-[family-name:var(--font-mono)] text-xs ${page === totalPages
                                ? "text-[var(--muted)] cursor-not-allowed"
                                : "text-[var(--text)] cursor-pointer"
                            }`}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
