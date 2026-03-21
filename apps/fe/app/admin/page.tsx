"use client";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 2rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: "2rem",
          color: "var(--text)",
          marginBottom: "0.5rem",
        }}
      >
        Admin Dashboard
      </h1>
      <p
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 13,
          color: "var(--muted)",
          marginBottom: "3rem",
        }}
      >
        Manage problems, contests, and platform settings
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
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
      style={{
        display: "block",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "1.5rem",
        textDecoration: "none",
        transition: "all .15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 24,
          marginBottom: "1rem",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: "1.1rem",
          color: "var(--text)",
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "var(--muted)",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
    </Link>
  );
}
