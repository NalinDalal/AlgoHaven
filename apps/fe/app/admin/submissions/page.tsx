"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

interface Submission {
    id: string;
    status: string;
    language: string;
    points: number;
    executionTimeMs: number | null;
    createdAt: string;
    user: { id: string; username: string | null; email: string };
    problem: { id: string; title: string; slug: string; difficulty: string };
}

const STATUS_STYLES: Record<string, string> = {
    ACCEPTED: "text-[#4ade80] bg-[#0d2e16] border-[#1a5c2d]",
    WRONG_ANSWER: "text-[#ff4d4d] bg-[#2d0d0d] border-[#5c1a1a]",
    TLE: "text-[#ffd700] bg-[#1a1a0d] border-[#4a4a1a]",
    MLE: "text-[var(--blue)] bg-[#0d1a2d] border-[#1a3a6e]",
    RUNTIME_ERROR: "text-[#ff9500] bg-[#2d1a0d] border-[#6e3a1a]",
    COMPILE_ERROR: "text-[#ff9500] bg-[#2d1a0d] border-[#6e3a1a]",
    QUEUED: "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]",
    RUNNING: "text-[var(--blue)] bg-[#0d1a2d] border-[#1a3a6e]",
};

const STATUS_OPTIONS = [
    "ALL", "ACCEPTED", "WRONG_ANSWER", "TLE", "MLE", "RUNTIME_ERROR", "COMPILE_ERROR", "QUEUED", "RUNNING",
] as const;

const TH_CLASS =
    "px-4 py-2.5 text-left font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--muted)] uppercase tracking-[.06em] bg-[#0d0d0d]";
const TD_CLASS = "px-4 py-3 align-middle";

function formatDuration(ms: number | null) {
    if (ms == null) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [search, setSearch] = useState("");
    const [rejudging, setRejudging] = useState<string | null>(null);
    const limit = 25;

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
        });
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (search.trim()) params.set("search", search.trim());

        apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/admin/submissions?${params}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success") {
                    setSubmissions(data.data.submissions);
                    if (data.data?.meta) {
                        setTotalPages(data.data.meta.totalPages);
                        setTotal(data.data.meta.total);
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, statusFilter, search]);

    const handleRejudge = async (id: string) => {
        setRejudging(id);
        try {
            const res = await apiFetch(
                `${process.env.NEXT_PUBLIC_BE_URL}/api/admin/submissions/${id}/rejudge`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );
            const data = await res.json();
            if (data.status === "success") {
                setSubmissions((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, status: "QUEUED" } : s)),
                );
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRejudging(null);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto p-8">
            <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[1.75rem] text-[var(--text)] mb-6">
                Submissions
            </h1>

            {/* Filters */}
            <div className="flex gap-4 mb-6 items-center">
                <input
                    type="text"
                    placeholder="Search user or problem..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="flex-1 max-w-[300px] bg-[var(--bg)] border border-[var(--border-lit)] rounded-sm px-3 py-2 font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)] outline-none"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="bg-[var(--bg)] border border-[var(--border-lit)] rounded-sm px-3 py-2 font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)] cursor-pointer"
                >
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                            {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
                        </option>
                    ))}
                </select>
                <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                    {total} submissions
                </span>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-[var(--muted)] font-[family-name:var(--font-mono)] text-[13px] p-8 text-center">
                    Loading...
                </div>
            ) : submissions.length === 0 ? (
                <div className="text-[var(--muted)] font-[family-name:var(--font-mono)] text-[13px] p-8 text-center">
                    No submissions found.
                </div>
            ) : (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                {["User", "Problem", "Status", "Lang", "Points", "Time", "Date", ""].map((h) => (
                                    <th key={h} className={TH_CLASS}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((s) => {
                                const ssClass = STATUS_STYLES[s.status] ?? STATUS_STYLES.QUEUED;
                                return (
                                    <tr
                                        key={s.id}
                                        className="border-b border-[var(--border-lit)]"
                                    >
                                        {/* User */}
                                        <td className={TD_CLASS}>
                                            <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                                                {s.user.username || s.user.email}
                                            </span>
                                        </td>

                                        {/* Problem */}
                                        <td className={TD_CLASS}>
                                            <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                                                {s.problem.title}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className={TD_CLASS}>
                                            <span
                                                className={`font-[family-name:var(--font-mono)] text-[11px] font-bold px-2.5 py-[3px] rounded-sm border whitespace-nowrap ${ssClass}`}
                                            >
                                                {s.status.replace("_", " ")}
                                            </span>
                                        </td>

                                        {/* Language */}
                                        <td className={TD_CLASS}>
                                            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)] capitalize">
                                                {s.language}
                                            </span>
                                        </td>

                                        {/* Points */}
                                        <td className={TD_CLASS}>
                                            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                                                {s.points}
                                            </span>
                                        </td>

                                        {/* Time */}
                                        <td className={TD_CLASS}>
                                            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                                                {formatDuration(s.executionTimeMs)}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className={TD_CLASS}>
                                            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                                                {formatDate(s.createdAt)}
                                            </span>
                                        </td>

                                        {/* Rejudge */}
                                        <td className={`${TD_CLASS} text-right`}>
                                            <button
                                                onClick={() => handleRejudge(s.id)}
                                                disabled={rejudging === s.id}
                                                className={`font-[family-name:var(--font-mono)] text-[11px] text-[var(--accent)] bg-transparent border border-[var(--border)] rounded-sm px-2.5 py-1 ${rejudging === s.id
                                                        ? "cursor-not-allowed opacity-50"
                                                        : "cursor-pointer opacity-100"
                                                    }`}
                                            >
                                                {rejudging === s.id ? "..." : "Rejudge"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
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
