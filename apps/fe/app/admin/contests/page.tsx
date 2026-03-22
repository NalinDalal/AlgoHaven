"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  status?: "upcoming" | "live" | "past";
  participantCount?: number;
  problemCount?: number;
}

export default function AdminContestsPage() {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/contest`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setContests(data.data.contests);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (contest: Contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    let status: "upcoming" | "live" | "past" = "past";
    if (now < start) status = "upcoming";
    else if (now <= end) status = "live";

    const styles = {
      upcoming: { bg: "#1a1a2e", color: "#60a5fa", text: "Upcoming" },
      live: { bg: "#0d2818", color: "#22c55e", text: "Live" },
      past: { bg: "#1a1a1a", color: "#888", text: "Past" },
    };

    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 8px",
          borderRadius: 2,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "var(--font-mono), monospace",
          background: styles[status].bg,
          color: styles[status].color,
        }}
      >
        {styles[status].text}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        Loading contests...
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
            Contests
          </h1>
        </div>
        <Link
          href="/admin/contests/new"
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
          + New Contest
        </Link>
      </div>

      {contests.length === 0 ? (
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
            🏆
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 14,
              color: "var(--muted)",
              marginBottom: "1.5rem",
            }}
          >
            No contests yet
          </p>
          <Link
            href="/admin/contests/new"
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              color: "var(--accent)",
            }}
          >
            Create your first contest →
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
                <th style={{ ...thStyle, width: 120 }}>Status</th>
                <th style={{ ...thStyle, width: 120 }}>Visibility</th>
                <th style={{ ...thStyle, width: 100 }}>Rated</th>
                <th style={{ ...thStyle, width: 80 }}>Problems</th>
                <th style={{ ...thStyle, width: 80 }}>Participants</th>
                <th style={{ ...thStyle, width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contests.map((contest) => (
                <tr
                  key={contest.id}
                  style={{ borderBottom: "1px solid var(--border-lit)" }}
                >
                  <td style={tdStyle}>
                    <div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        {contest.title}
                      </span>
                      <div
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 11,
                          color: "var(--muted)",
                          marginTop: 2,
                        }}
                      >
                        {formatDate(contest.startTime)} -{" "}
                        {formatDate(contest.endTime)}
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>{getStatusBadge(contest)}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 11,
                        color: "var(--muted)",
                      }}
                    >
                      {contest.visibility}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 11,
                        color: contest.isRated
                          ? "var(--code-green)"
                          : "var(--muted)",
                      }}
                    >
                      {contest.isRated ? "Yes" : "No"}
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
                      {contest.problemCount ?? 0}
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
                      {contest.participantCount ?? 0}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link
                        href={`/admin/contests/${contest.id}`}
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
                    </div>
                  </td>
                </tr>
              ))}
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
