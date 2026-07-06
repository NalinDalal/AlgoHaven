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

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  ACCEPTED: { color: "#4ade80", bg: "#0d2e16", border: "#1a5c2d" },
  WRONG_ANSWER: { color: "#ff4d4d", bg: "#2d0d0d", border: "#5c1a1a" },
  TLE: { color: "#ffd700", bg: "#1a1a0d", border: "#4a4a1a" },
  MLE: { color: "var(--blue)", bg: "#0d1a2d", border: "#1a3a6e" },
  RUNTIME_ERROR: { color: "#ff9500", bg: "#2d1a0d", border: "#6e3a1a" },
  COMPILE_ERROR: { color: "#ff9500", bg: "#2d1a0d", border: "#6e3a1a" },
  QUEUED: { color: "var(--muted)", bg: "var(--surface)", border: "var(--border)" },
  RUNNING: { color: "var(--blue)", bg: "#0d1a2d", border: "#1a3a6e" },
};

const STATUS_OPTIONS = [
  "ALL", "ACCEPTED", "WRONG_ANSWER", "TLE", "MLE", "RUNTIME_ERROR", "COMPILE_ERROR", "QUEUED", "RUNNING",
] as const;

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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: "1.75rem",
          color: "var(--text)",
          marginBottom: "1.5rem",
        }}
      >
        Submissions
      </h1>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search user or problem..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            maxWidth: 300,
            background: "var(--bg)",
            border: "1px solid var(--border-lit)",
            borderRadius: 2,
            padding: "8px 12px",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            color: "var(--text)",
            outline: "none",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border-lit)",
            borderRadius: 2,
            padding: "8px 12px",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
            </option>
          ))}
        </select>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          {total} submissions
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "var(--muted)", fontFamily: "var(--font-mono), monospace", fontSize: 13, padding: "2rem", textAlign: "center" }}>
          Loading...
        </div>
      ) : submissions.length === 0 ? (
        <div style={{ color: "var(--muted)", fontFamily: "var(--font-mono), monospace", fontSize: 13, padding: "2rem", textAlign: "center" }}>
          No submissions found.
        </div>
      ) : (
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
                {["User", "Problem", "Status", "Lang", "Points", "Time", "Date", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      background: "#0d0d0d",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const ss = STATUS_STYLES[s.status] ?? STATUS_STYLES.QUEUED;
                return (
                  <tr
                    key={s.id}
                    style={{ borderBottom: "1px solid var(--border-lit)" }}
                  >
                    {/* User */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 13,
                          color: "var(--text)",
                        }}
                      >
                        {s.user.username || s.user.email}
                      </span>
                    </td>

                    {/* Problem */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 13,
                          color: "var(--text)",
                        }}
                      >
                        {s.problem.title}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 11,
                          fontWeight: 700,
                          color: ss.color,
                          background: ss.bg,
                          border: `1px solid ${ss.border}`,
                          padding: "3px 10px",
                          borderRadius: 2,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Language */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 12,
                          color: "var(--muted)",
                          textTransform: "capitalize",
                        }}
                      >
                        {s.language}
                      </span>
                    </td>

                    {/* Points */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        {s.points}
                      </span>
                    </td>

                    {/* Time */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        {formatDuration(s.executionTimeMs)}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        {formatDate(s.createdAt)}
                      </span>
                    </td>

                    {/* Rejudge */}
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <button
                        onClick={() => handleRejudge(s.id)}
                        disabled={rejudging === s.id}
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 11,
                          color: "var(--accent)",
                          background: "transparent",
                          border: "1px solid var(--border)",
                          borderRadius: 2,
                          padding: "4px 10px",
                          cursor: rejudging === s.id ? "not-allowed" : "pointer",
                          opacity: rejudging === s.id ? 0.5 : 1,
                        }}
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "1.5rem",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "8px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: page === 1 ? "var(--muted)" : "var(--text)",
              cursor: page === 1 ? "not-allowed" : "pointer",
              borderRadius: 2,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
            }}
          >
            ← Prev
          </button>
          <span style={{ color: "var(--muted)", padding: "8px" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "8px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: page === totalPages ? "var(--muted)" : "var(--text)",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              borderRadius: 2,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  verticalAlign: "middle",
};
