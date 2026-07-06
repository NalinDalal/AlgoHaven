"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";

interface User {
    id: string;
    email: string;
    username: string | null;
    role: "USER" | "ADMIN";
    createdAt: string;
}

interface PaginatedUsers {
    users: User[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const TH_CLASS =
    "px-4 py-3 text-left font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--muted)] uppercase tracking-[.06em] bg-[#0d0d0d]";
const TD_CLASS = "px-4 py-3.5 align-middle";

export default function AdminUsersPage() {
    const [data, setData] = useState<PaginatedUsers | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/users?page=${page}&limit=20`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success") {
                    setData(data.data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page]);

    const updateRole = async (userId: string, newRole: "USER" | "ADMIN") => {
        setUpdating(userId);
        try {
            const res = await apiFetch(
                `${process.env.NEXT_PUBLIC_BE_URL}/api/users/${userId}/role`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "X-Requested-By": "AlgoHaven" },
                    credentials: "include",
                    body: JSON.stringify({ role: newRole }),
                },
            );
            const result = await res.json();
            if (result.status === "success") {
                setData((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        users: prev.users.map((u) =>
                            u.id === userId ? { ...u, role: newRole } : u,
                        ),
                    };
                });
            } else {
                alert(result.message || "Failed to update role");
            }
        } catch (err) {
            alert("Failed to update role");
        } finally {
            setUpdating(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-[var(--muted)] font-[family-name:var(--font-mono)]">
                Loading users...
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto p-8">
            <Link
                href="/admin"
                className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)] no-underline mb-4 inline-block"
            >
                ← Back to Dashboard
            </Link>

            <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[1.75rem] text-[var(--text)] mt-0 mb-8">
                Users
            </h1>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-[var(--border)]">
                            <th className={TH_CLASS}>Email</th>
                            <th className={`${TH_CLASS} w-[120px]`}>Username</th>
                            <th className={`${TH_CLASS} w-[100px]`}>Role</th>
                            <th className={`${TH_CLASS} w-[120px]`}>Joined</th>
                            <th className={`${TH_CLASS} w-[100px]`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.users.map((user) => (
                            <tr
                                key={user.id}
                                className="border-b border-[var(--border-lit)]"
                            >
                                <td className={TD_CLASS}>
                                    <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                                        {user.email}
                                    </span>
                                </td>
                                <td className={TD_CLASS}>
                                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                                        {user.username || "—"}
                                    </span>
                                </td>
                                <td className={TD_CLASS}>
                                    <span
                                        className={`font-[family-name:var(--font-mono)] text-[11px] font-bold px-2 py-1 rounded-sm ${user.role === "ADMIN"
                                                ? "bg-[#1a1a2e] text-[#60a5fa]"
                                                : "bg-[#0d0d0d] text-[#888]"
                                            }`}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                <td className={TD_CLASS}>
                                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                                        {formatDate(user.createdAt)}
                                    </span>
                                </td>
                                <td className={TD_CLASS}>
                                    {updating === user.id ? (
                                        <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                                            Updating...
                                        </span>
                                    ) : (
                                        <div className="flex gap-2">
                                            {user.role === "USER" ? (
                                                <button
                                                    onClick={() => updateRole(user.id, "ADMIN")}
                                                    className="px-2 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[#60a5fa] bg-transparent border-none cursor-pointer"
                                                >
                                                    Make Admin
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => updateRole(user.id, "USER")}
                                                    className="px-2 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)] bg-transparent border-none cursor-pointer"
                                                >
                                                    Remove Admin
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data && data.meta.totalPages > 1 && (
                <div className="flex justify-center gap-4 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className={`px-4 py-2 font-[family-name:var(--font-mono)] text-xs bg-[var(--surface)] border border-[var(--border)] rounded-sm ${page === 1
                                ? "text-[var(--muted)] cursor-not-allowed"
                                : "text-[var(--text)] cursor-pointer"
                            }`}
                    >
                        Previous
                    </button>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)] p-2">
                        Page {page} of {data.meta.totalPages}
                    </span>
                    <button
                        onClick={() =>
                            setPage((p) => Math.min(data.meta.totalPages, p + 1))
                        }
                        disabled={page === data.meta.totalPages}
                        className={`px-4 py-2 font-[family-name:var(--font-mono)] text-xs bg-[var(--surface)] border border-[var(--border)] rounded-sm ${page === data.meta.totalPages
                                ? "text-[var(--muted)] cursor-not-allowed"
                                : "text-[var(--text)] cursor-pointer"
                            }`}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
