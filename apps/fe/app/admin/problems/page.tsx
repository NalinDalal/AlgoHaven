"use client";

/**
 * Admin Problems List Page
 *
 * Displays a table of all problems in the system.
 * Provides functionality to:
 * - View all problems with their details
 * - Navigate to create new problem
 * - Edit existing problems
 * - Delete problems
 *
 * Route: /admin/problems
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

/**
 * Interface representing a problem in the list
 * Contains summary fields for display in the table
 */
interface Problem {
    id: string;
    title: string;
    slug: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    isPublic: boolean;
    createdAt: string;
    _count?: {
        testCases: number;
        submissions: number;
    };
}

const DIFFICULTY_BADGE: Record<string, string> = {
    EASY: "bg-[#0d2818] text-[#22c55e] border-[#166534]",
    MEDIUM: "bg-[#1c1a0d] text-[#eab308] border-[#854d0e]",
    HARD: "bg-[#2d0d0d] text-[#ef4444] border-[#991b1b]",
};
const DIFFICULTY_BADGE_DEFAULT = "bg-[#1a1a1a] text-[#888] border-[#333]";

const TH_CLASS =
    "px-4 py-3 text-left font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--muted)] uppercase tracking-[.06em] bg-[#0d0d0d]";
const TD_CLASS = "px-4 py-3.5 align-middle";

/**
 * Main Admin Problems Page Component
 *
 * Fetches and displays all problems in a sortable table.
 * Provides action buttons for edit and delete operations.
 *
 * @returns JSX element with problems table
 */
export default function AdminProblemsPage() {
    const router = useRouter();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 25;

    useEffect(() => {
        setLoading(true);
        apiFetch(
            `${process.env.NEXT_PUBLIC_BE_URL}/api/problems?page=${page}&limit=${limit}`,
            { credentials: "include" },
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success") {
                    setProblems(data.data.problems);
                    if (data.data?.meta) {
                        setTotalPages(data.data.meta.totalPages);
                        setTotal(data.data.meta.total);
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page]);

    /**
     * Handles problem deletion
     * Shows confirmation dialog before deleting
     *
     * @param id - The ID of the problem to delete
     * @param title - The title for confirmation message
     */
    const handleDelete = async (id: string, title: string) => {
        // Show confirmation dialog
        if (!confirm(`Delete problem "${title}"? This cannot be undone.`)) return;

        setDeleting(id); // Show loading for this row
        try {
            const res = await apiFetch(
                `${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`,
                {
                    method: "DELETE",
                    headers: { "X-Requested-By": "AlgoHaven" },
                    credentials: "include",
                },
            );
            const data = await res.json();
            if (data.status === "success") {
                setProblems(problems.filter((p) => p.id !== id));
            } else {
                alert(data.message || "Failed to delete");
            }
        } catch (err) {
            alert("Failed to delete");
        } finally {
            setDeleting(null);
        }
    };

    const getDifficultyClass = (difficulty: string) => {
        return DIFFICULTY_BADGE[difficulty] ?? DIFFICULTY_BADGE_DEFAULT;
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-[var(--muted)] font-[family-name:var(--font-mono)]">
                Loading problems...
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
                        Problems
                    </h1>
                </div>
                <Link
                    href="/admin/problems/new"
                    className="bg-[var(--accent)] text-black px-5 py-2.5 rounded-sm font-[family-name:var(--font-mono)] text-[13px] font-bold no-underline"
                >
                    + New Problem
                </Link>
            </div>

            {problems.length === 0 ? (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded text-center p-16">
                    <div className="font-[family-name:var(--font-mono)] text-[32px] mb-4">
                        {}
                    </div>
                    <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--muted)] mb-6">
                        No problems yet
                    </p>
                    <Link
                        href="/admin/problems/new"
                        className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--accent)]"
                    >
                        Create your first problem →
                    </Link>
                </div>
            ) : (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className={TH_CLASS}>Title</th>
                                <th className={`${TH_CLASS} w-[100px]`}>Slug</th>
                                <th className={`${TH_CLASS} w-[100px]`}>Difficulty</th>
                                <th className={`${TH_CLASS} w-[80px]`}>Status</th>
                                <th className={`${TH_CLASS} w-[80px]`}>Test Cases</th>
                                <th className={`${TH_CLASS} w-[100px]`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {problems.map((problem) => {
                                const diffClass = getDifficultyClass(problem.difficulty);
                                return (
                                    <tr
                                        key={problem.id}
                                        className="border-b border-[var(--border-lit)]"
                                    >
                                        <td className={TD_CLASS}>
                                            <span className="font-[family-name:var(--font-mono)] text-[13px] font-semibold text-[var(--text)]">
                                                {problem.title}
                                            </span>
                                        </td>
                                        <td className={TD_CLASS}>
                                            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                                                {problem.slug}
                                            </span>
                                        </td>
                                        <td className={TD_CLASS}>
                                            <span
                                                className={`inline-block px-2 py-1 rounded-sm text-[11px] font-bold font-[family-name:var(--font-mono)] border ${diffClass}`}
                                            >
                                                {problem.difficulty}
                                            </span>
                                        </td>
                                        <td className={TD_CLASS}>
                                            <span
                                                className={`font-[family-name:var(--font-mono)] text-[11px] ${problem.isPublic
                                                        ? "text-[var(--code-green)]"
                                                        : "text-[var(--muted)]"
                                                    }`}
                                            >
                                                {problem.isPublic ? "Public" : "Hidden"}
                                            </span>
                                        </td>
                                        <td className={TD_CLASS}>
                                            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                                                {problem._count?.testCases ?? 0}
                                            </span>
                                        </td>
                                        <td className={TD_CLASS}>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/admin/problems/${problem.id}`}
                                                    className="px-2 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--accent)] no-underline"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(problem.id, problem.title)
                                                    }
                                                    disabled={deleting === problem.id}
                                                    className={`px-2 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--red)] bg-transparent border-none ${deleting === problem.id
                                                            ? "cursor-not-allowed opacity-50"
                                                            : "cursor-pointer opacity-100"
                                                        }`}
                                                >
                                                    {deleting === problem.id ? "..." : "Delete"}
                                                </button>
                                            </div>
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
                <div className="flex justify-between items-center mt-6 font-[family-name:var(--font-mono)] text-xs">
                    <span className="text-[var(--muted)]">{total} problems total</span>
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
                        <span className="text-[var(--muted)]">
                            {page} / {totalPages}
                        </span>
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
    );
}
