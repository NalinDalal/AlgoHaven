"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  username: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
}

interface PaginatedUsers {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/users?page=${page}&limit=20`, {
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/users/${userId}/role`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "var(--muted)",
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        Loading users...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      <Link
        href="/admin"
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "var(--muted)",
          textDecoration: "none",
          marginBottom: "1rem",
          display: "inline-block",
        }}
      >
        ← Back to Dashboard
      </Link>

      <h1
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: "1.75rem",
          color: "var(--text)",
          margin: "0 0 2rem 0",
        }}
      >
        Users
      </h1>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={thStyle}>Email</th>
              <th style={{ ...thStyle, width: 120 }}>Username</th>
              <th style={{ ...thStyle, width: 100 }}>Role</th>
              <th style={{ ...thStyle, width: 120 }}>Joined</th>
              <th style={{ ...thStyle, width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((user) => (
              <tr
                key={user.id}
                style={{ borderBottom: "1px solid var(--border-lit)" }}
              >
                <td style={tdStyle}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 13,
                      color: "var(--text)",
                    }}
                  >
                    {user.email}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    {user.username || "—"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: 2,
                      background: user.role === "ADMIN" ? "#1a1a2e" : "#0d0d0d",
                      color: user.role === "ADMIN" ? "#60a5fa" : "#888",
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    {formatDate(user.createdAt)}
                  </span>
                </td>
                <td style={tdStyle}>
                  {updating === user.id ? (
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 11,
                        color: "var(--muted)",
                      }}
                    >
                      Updating...
                    </span>
                  ) : (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {user.role === "USER" ? (
                        <button
                          onClick={() => updateRole(user.id, "ADMIN")}
                          style={{
                            padding: "4px 8px",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: 11,
                            color: "#60a5fa",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => updateRole(user.id, "USER")}
                          style={{
                            padding: "4px 8px",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: 11,
                            color: "var(--muted)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
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

      {data && data.pagination.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "8px 16px",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: page === 1 ? "var(--muted)" : "var(--text)",
              cursor: page === 1 ? "not-allowed" : "pointer",
              borderRadius: 2,
            }}
          >
            Previous
          </button>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "var(--muted)",
              padding: "8px",
            }}
          >
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(data.pagination.totalPages, p + 1))
            }
            disabled={page === data.pagination.totalPages}
            style={{
              padding: "8px 16px",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color:
                page === data.pagination.totalPages
                  ? "var(--muted)"
                  : "var(--text)",
              cursor:
                page === data.pagination.totalPages ? "not-allowed" : "pointer",
              borderRadius: 2,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontFamily: "var(--font-mono), monospace",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: ".06em",
  background: "#0d0d0d",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  verticalAlign: "middle",
};
