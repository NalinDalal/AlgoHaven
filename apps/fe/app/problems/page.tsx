"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  slug: string;
  tags?: string[];
  acceptance?: number;
  solved?: number;
}

const DIFF_STYLES: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  Easy: {
    color: "#4ade80",
    bg: "#0d2e16",
    border: "#1a5c2d",
  },
  Medium: {
    color: "#ffd700",
    bg: "#1a1a0d",
    border: "#4a4a1a",
  },
  Hard: {
    color: "#ff4d4d",
    bg: "#2d0d0d",
    border: "#5c1a1a",
  },
};

const FILTERS = ["All", "Easy", "Medium", "Hard"] as const;
type Filter = (typeof FILTERS)[number];

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/problems?start=0&end=20`)
      .then((res) => res.json())
      .then((data) => {
        setProblems(data.data?.problems || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const filtered = problems.filter((p) => {
    const matchesDiff = filter === "All" || p.difficulty === filter;
    const matchesSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.id.includes(search);
    return matchesDiff && matchesSearch;
  });

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
            // Problem set
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
            All Problems
          </h1>

          {/* Toolbar */}
          <div
            className="flex flex-wrap items-center gap-3"
            style={{ paddingBottom: "1.5rem" }}
          >
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 13,
                  color: "var(--muted)",
                  pointerEvents: "none",
                }}
              >
                /
              </span>
              <input
                type="text"
                placeholder="Search by title or #id..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--surface)",
                  border: "1px solid var(--border-lit)",
                  borderRadius: 2,
                  padding: "9px 12px 9px 28px",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 13,
                  color: "var(--text)",
                  outline: "none",
                  transition: "border-color .15s",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--accent)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border-lit)")
                }
              />
            </div>

            {/* Difficulty filters */}
            <div className="flex gap-2">
              {FILTERS.map((f) => {
                const isActive = filter === f;
                const ds = f !== "All" ? DIFF_STYLES[f] : null;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "7px 16px",
                      borderRadius: 2,
                      border: isActive
                        ? `1px solid ${ds?.border ?? "var(--accent)"}`
                        : "1px solid var(--border)",
                      background: isActive
                        ? (ds?.bg ?? "rgba(232,255,71,.08)")
                        : "transparent",
                      color: isActive
                        ? (ds?.color ?? "var(--accent)")
                        : "var(--muted)",
                      cursor: "pointer",
                      transition: "all .15s",
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2.5rem 4rem" }}
        >
          {loading ? (
            <SkeletonTable />
          ) : error ? (
            <ErrorState />
          ) : filtered.length === 0 ? (
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
                  {["#", "Title", "Difficulty", "Acceptance", ""].map((h) => (
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
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <ProblemRow key={p.id} problem={p} index={i + 1} />
                ))}
              </tbody>
            </table>
          )}

          {/* Footer count */}
          {!loading && !error && (
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 12,
                color: "var(--muted)",
                marginTop: "1.5rem",
                borderTop: "1px solid var(--border)",
                paddingTop: "1rem",
              }}
            >
              Showing{" "}
              <span style={{ color: "var(--accent)" }}>{filtered.length}</span>{" "}
              of {problems.length} problems
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ProblemRow({ problem, index }: { problem: Problem; index: number }) {
  const ds = DIFF_STYLES[problem.difficulty] ?? DIFF_STYLES.Medium;
  const acceptance = problem.acceptance ?? Math.floor(40 + Math.random() * 45);

  return (
    <tr
      style={{ transition: "background .12s", cursor: "pointer" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--surface)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Index */}
      <td
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "var(--muted)",
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          width: 60,
        }}
      >
        {String(index).padStart(3, "0")}
      </td>

      {/* Title */}
      <td
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href={`/problems/${problem.id}`}
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
          {problem.title}
        </Link>
        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {problem.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  color: "#555",
                  border: "1px solid var(--border)",
                  padding: "1px 6px",
                  borderRadius: 2,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </td>

      {/* Difficulty */}
      <td
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          width: 110,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            fontWeight: 700,
            color: ds.color,
            background: ds.bg,
            border: `1px solid ${ds.border}`,
            padding: "3px 10px",
            borderRadius: 2,
            whiteSpace: "nowrap",
          }}
        >
          {problem.difficulty}
        </span>
      </td>

      {/* Acceptance bar */}
      <td
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          width: 160,
        }}
      >
        <div
          className="flex items-center gap-3"
          style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12 }}
        >
          <div
            style={{
              flex: 1,
              height: 3,
              background: "var(--border-lit)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${acceptance}%`,
                background: ds.color,
                borderRadius: 2,
              }}
            />
          </div>
          <span
            style={{ color: "var(--muted)", minWidth: 36, textAlign: "right" }}
          >
            {acceptance}%
          </span>
        </div>
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
          href={`/problems/${problem.slug || problem.id}`}
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
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 52,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 16px",
          }}
        >
          <div
            style={{
              width: 40,
              height: 10,
              background: "var(--surface)",
              borderRadius: 2,
              animation: "pulse 1.5s ease infinite",
            }}
          />
          <div
            style={{
              flex: 1,
              height: 10,
              background: "var(--surface)",
              borderRadius: 2,
              animation: "pulse 1.5s ease infinite",
              animationDelay: `${i * 0.05}s`,
            }}
          />
          <div
            style={{
              width: 60,
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
      <div style={{ fontSize: 14 }}>No problems match your filters.</div>
      <div style={{ fontSize: 12, marginTop: 6, color: "#333" }}>
        Try a different search or difficulty.
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
        Error: Could not reach judge server. Is the backend running?
      </div>
    </div>
  );
}
