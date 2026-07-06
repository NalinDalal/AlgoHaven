"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
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
  status: "upcoming" | "live" | "past";
  participantCount: number;
  problemCount: number;
}

const STATUS_STYLES: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  upcoming: { color: "var(--blue)", bg: "#0d1a2d", border: "#1a3a6e", label: "Upcoming" },
  live: { color: "var(--code-green)", bg: "#0d2e16", border: "#1a5c2d", label: "Live" },
  past: { color: "var(--muted)", bg: "var(--surface)", border: "var(--border)", label: "Past" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    apiFetch(
      `${process.env.NEXT_PUBLIC_BE_URL}/api/contest?page=${page}&limit=${limit}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setContests(data.data.contests || []);
          if (data.data?.meta) {
            setTotalPages(data.data.meta.totalPages);
            setTotal(data.data.meta.total);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [page]);

  return (
    <>
      <Nav />
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          paddingTop: 80,
        }}
      >
        {/* Page header */}
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            padding: "2.5rem 2.5rem 0",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "var(--accent)",
              letterSpacing: ".12em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            // Contests
          </div>
          <h1
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-.03em",
              lineHeight: 1,
              color: "var(--text)",
              marginBottom: "2rem",
            }}
          >
            All Contests
          </h1>
        </div>

        {/* Table */}
        <div
          style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2.5rem 4rem" }}
        >
          {loading ? (
            <SkeletonTable />
          ) : error ? (
            <ErrorState />
          ) : contests.length === 0 ? (
            <EmptyState />
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "0.5rem",
              }}
            >
              <thead>
                <tr>
                  {["Title", "Status", "Duration", "Problems", "Participants", ""].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 11,
                          color: "var(--muted)",
                          textAlign: "left",
                          padding: "10px 16px",
                          borderBottom: "1px solid var(--border)",
                          letterSpacing: ".06em",
                          textTransform: "uppercase",
                          fontWeight: 500,
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {contests.map((c) => (
                  <ContestRow key={c.id} contest={c} />
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 12,
                color: "var(--muted)",
                marginTop: "1.5rem",
                borderTop: "1px solid var(--border)",
                paddingTop: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Page <span style={{ color: "var(--accent)" }}>{page}</span> of{" "}
                {totalPages} ({total} contests)
              </span>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    padding: "6px 12px",
                    borderRadius: 2,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: page <= 1 ? "#333" : "var(--muted)",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    padding: "6px 12px",
                    borderRadius: 2,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: page >= totalPages ? "#333" : "var(--muted)",
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ContestRow({ contest }: { contest: Contest }) {
  const ss = STATUS_STYLES[contest.status] ?? STATUS_STYLES.past;
  const start = new Date(contest.startTime);
  const end = new Date(contest.endTime);
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <tr
      style={{ transition: "background .12s", cursor: "pointer" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--surface)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Title */}
      <td
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href={`/contests/${contest.id}`}
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--text)",
            textDecoration: "none",
            transition: "color .12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
        >
          {contest.title}
        </Link>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: "var(--muted)",
            marginTop: 2,
          }}
        >
          {formatDate(contest.startTime)}
        </div>
      </td>

      {/* Status */}
      <td
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          width: 110,
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
            {ss.label}
          </span>
          {contest.isPractice && (
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                fontWeight: 700,
                color: "#a78bfa",
                background: "#1a0d2e",
                border: "1px solid #3a1a6e",
                padding: "2px 8px",
                borderRadius: 2,
                whiteSpace: "nowrap",
              }}
            >
              Virtual
            </span>
          )}
        </div>
      </td>

      {/* Duration */}
      <td
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "var(--muted)",
          width: 100,
        }}
      >
        {durationStr}
      </td>

      {/* Problems */}
      <td
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "var(--muted)",
          width: 90,
        }}
      >
        {contest.problemCount}
      </td>

      {/* Participants */}
      <td
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "var(--muted)",
          width: 110,
        }}
      >
        {contest.participantCount}
      </td>

      {/* Arrow */}
      <td
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          width: 40,
          textAlign: "right",
        }}
      >
        <Link
          href={`/contests/${contest.id}`}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            color: "var(--muted)",
            textDecoration: "none",
            transition: "color .12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          →
        </Link>
      </td>
    </tr>
  );
}

function SkeletonTable() {
  return (
    <div style={{ marginTop: "0.5rem" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 56,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 16px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 10,
              background: "var(--surface)",
              borderRadius: 2,
              animation: "pulse 1.5s ease infinite",
            }}
          />
          <div
            style={{
              width: 70,
              height: 10,
              background: "var(--surface)",
              borderRadius: 2,
              animation: "pulse 1.5s ease infinite",
              animationDelay: `${i * 0.05}s`,
            }}
          />
          <div
            style={{
              width: 50,
              height: 10,
              background: "var(--surface)",
              borderRadius: 2,
              animation: "pulse 1.5s ease infinite",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        padding: "5rem 2rem",
        fontFamily: "var(--font-mono), monospace",
        color: "var(--muted)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 32,
          marginBottom: "1rem",
          color: "var(--border-lit)",
        }}
      >
        {"{ }"}
      </div>
      <div style={{ fontSize: 14 }}>No contests yet.</div>
      <div style={{ fontSize: 12, marginTop: 6, color: "#333" }}>
        Check back later for upcoming contests.
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        padding: "5rem 2rem",
        fontFamily: "var(--font-mono), monospace",
        color: "var(--muted)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#ff4d4d",
          border: "1px solid #5c1a1a",
          background: "#2d0d0d",
          padding: "10px 20px",
          borderRadius: 2,
        }}
      >
        Error loading contests. Is the backend running?
      </div>
    </div>
  );
}
