"use client";
import Link from "next/link";

export default function AdminDashboard() {
    return (
        <div className="max-w-[1200px] mx-auto py-12 px-8">
            <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-3xl text-[var(--text)] mb-2">
                Admin Dashboard
            </h1>
            <p className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--muted)] mb-12">
                Manage problems, contests, and platform settings
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                <AdminCard
                    title="Problems"
                    description="Create, edit, and manage problem statements and test cases"
                    href="/admin/problems/new"
                    icon="{ }"
                />
                <AdminCard
                    title="Contests"
                    description="Create contests, add problems, and manage schedules"
                    href="/admin/contests/new"
                    icon="🏆"
                />
                <AdminCard
                    title="Submissions"
                    description="View all submissions and manage rejudge requests"
                    href="/admin/submissions"
                    icon="↗"
                />
                <AdminCard
                    title="Users"
                    description="Manage user roles and permissions"
                    href="/admin/users"
                    icon="@"
                />
            </div>
        </div>
    );
}

function AdminCard({
    title,
    description,
    href,
    icon,
}: {
    title: string;
    description: string;
    href: string;
    icon: string;
}) {
    return (
        <Link
            href={href}
            className="block bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded p-6 no-underline transition-all duration-150 hover:-translate-y-0.5"
        >
            <div className="font-[family-name:var(--font-mono)] text-2xl mb-4">
                {icon}
            </div>
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-[1.1rem] text-[var(--text)] mb-2">
                {title}
            </h3>
            <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted)] leading-normal">
                {description}
            </p>
        </Link>
    );
}
