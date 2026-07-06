"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

interface User {
    id: string;
    email: string;
    username: string | null;
    role: "USER" | "ADMIN";
}

const NAV_LINK_CLASS =
    "font-[family-name:var(--font-mono)] text-[13px] text-[var(--muted)] no-underline";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/me`)
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success" && data.data?.user) {
                    setUser(data.data.user);
                    if (data.data.user.role !== "ADMIN") {
                        router.push("/");
                    }
                } else {
                    router.push("/auth");
                }
            })
            .catch(() => {
                router.push("/auth");
            })
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center font-[family-name:var(--font-mono)] text-[var(--muted)]">
                Loading...
            </div>
        );
    }

    if (!user || user.role !== "ADMIN") {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            {/* Admin nav */}
            <nav className="border-b border-[var(--border)] px-8 py-4 flex items-center justify-between bg-[var(--surface)] sticky top-0 z-[100]">
                <div className="flex items-center gap-8">
                    <Link
                        href="/admin"
                        className="font-[family-name:var(--font-syne)] font-extrabold text-xl text-[var(--accent)] no-underline"
                    >
                        AlgoHaven Admin
                    </Link>
                    <div className="flex gap-6">
                        <Link href="/admin" className={NAV_LINK_CLASS}>
                            Dashboard
                        </Link>
                        <Link href="/admin/problems" className={NAV_LINK_CLASS}>
                            Problems
                        </Link>
                        <Link href="/admin/contests" className={NAV_LINK_CLASS}>
                            Contests
                        </Link>
                        <Link href="/admin/users" className={NAV_LINK_CLASS}>
                            Users
                        </Link>
                        <Link href="/admin/submissions" className={NAV_LINK_CLASS}>
                            Submissions
                        </Link>
                        <Link href="/admin/problems/new" className={NAV_LINK_CLASS}>
                            + Problem
                        </Link>
                        <Link href="/admin/contests/new" className={NAV_LINK_CLASS}>
                            + Contest
                        </Link>
                    </div>
                </div>
                <div className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                    {user.email}
                </div>
            </nav>
            <main>{children}</main>
        </div>
    );
}
