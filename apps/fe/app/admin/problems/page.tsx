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
  const [problems, setProblems] = useState<Problem[]>([]); // Problems list state
  const [loading, setLoading] = useState(true); // Loading state
  const [deleting, setDeleting] = useState<string | null>(null); // Track deletion in progress

  /**
   * Effect hook to fetch problems on component mount
   * Loads all problems from the API
   */
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/problems`, {
      credentials: "include", // Include cookies for authentication
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setProblems(data.data.problems);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`,
        {
          method: "DELETE",
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return { bg: "#0d2818", color: "#22c55e", border: "#166534" };
      case "MEDIUM":
        return { bg: "#1c1a0d", color: "#eab308", border: "#854d0e" };
      case "HARD":
        return { bg: "#2d0d0d", color: "#ef4444", border: "#991b1b" };
      default:
        return { bg: "#1a1a1a", color: "#888", border: "#333" };
    }
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
        Loading problems...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <Link
            href="/admin"
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "var(--muted)",
              textDecoration: "none",
              marginBottom: "0.5rem",
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
              margin: 0,
            }}
          >
            Problems
          </h1>
        </div>
        <Link
          href="/admin/problems/new"
          style={{
            background: "var(--accent)",
            color: "#000",
            padding: "10px 20px",
            borderRadius: 2,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          + New Problem
        </Link>
      </div>

      {problems.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "4rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 32,
              marginBottom: "1rem",
            }}
          >
            {}
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 14,
              color: "var(--muted)",
              marginBottom: "1.5rem",
            }}
          >
            No problems yet
          </p>
          <Link
            href="/admin/problems/new"
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              color: "var(--accent)",
            }}
          >
            Create your first problem →
          </Link>
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
                <th style={thStyle}>Title</th>
                <th style={{ ...thStyle, width: 100 }}>Slug</th>
                <th style={{ ...thStyle, width: 100 }}>Difficulty</th>
                <th style={{ ...thStyle, width: 80 }}>Status</th>
                <th style={{ ...thStyle, width: 80 }}>Test Cases</th>
                <th style={{ ...thStyle, width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => {
                const diffStyle = getDifficultyColor(problem.difficulty);
                return (
                  <tr
                    key={problem.id}
                    style={{ borderBottom: "1px solid var(--border-lit)" }}
                  >
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        {problem.title}
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
                        {problem.slug}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: 2,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono), monospace",
                          background: diffStyle.bg,
                          color: diffStyle.color,
                          border: `1px solid ${diffStyle.border}`,
                        }}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 11,
                          color: problem.isPublic
                            ? "var(--code-green)"
                            : "var(--muted)",
                        }}
                      >
                        {problem.isPublic ? "Public" : "Hidden"}
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
                        {problem._count?.testCases ?? 0}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link
                          href={`/admin/problems/${problem.id}`}
                          style={{
                            padding: "4px 8px",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: 11,
                            color: "var(--accent)",
                            textDecoration: "none",
                          }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(problem.id, problem.title)
                          }
                          disabled={deleting === problem.id}
                          style={{
                            padding: "4px 8px",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: 11,
                            color: "var(--red)",
                            background: "transparent",
                            border: "none",
                            cursor:
                              deleting === problem.id
                                ? "not-allowed"
                                : "pointer",
                            opacity: deleting === problem.id ? 0.5 : 1,
                          }}
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
