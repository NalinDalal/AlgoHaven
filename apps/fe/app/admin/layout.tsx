"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  username: string | null;
  role: "USER" | "ADMIN";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/me`)
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
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono), monospace",
          color: "var(--muted)",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Admin nav */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link
            href="/admin"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: "1.25rem",
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            AlgoHaven Admin
          </Link>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link
              href="/admin"
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 13,
                color: "var(--muted)",
                textDecoration: "none",
              }}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/problems/new"
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 13,
                color: "var(--muted)",
                textDecoration: "none",
              }}
            >
              New Problem
            </Link>
            <Link
              href="/admin/contests/new"
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 13,
                color: "var(--muted)",
                textDecoration: "none",
              }}
            >
              New Contest
            </Link>
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          {user.email}
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
