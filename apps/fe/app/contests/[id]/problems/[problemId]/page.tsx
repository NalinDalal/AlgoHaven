"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import ProblemPanel from "@/components/ProblemPanel";
import EditorPanel from "@/components/EditorPanel";
import { apiFetch } from "@/lib/apiFetch";
import type { ProblemData, SampleTestCase } from "@/components/problemWrapper";

interface ContestProblemResponse {
  problem: {
    id: string;
    index: string;
    points: number;
    userStatus: "solved" | "unsolved";
    solvedAt: string | null;
    problem: {
      id: string;
      title: string;
      slug: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      statement: string;
      tags: string[];
      timeLimitMs: number;
      memoryLimitKb: number;
      testCases: {
        id: string;
        input: string;
        expectedOutput: string;
      }[];
    };
  };
}

const DIFF_STYLES: Record<string, { chip: string; label: string }> = {
  EASY: { chip: "bg-green-950 border border-green-900 text-green-400", label: "Easy" },
  MEDIUM: { chip: "bg-yellow-950 border border-yellow-900 text-yellow-400", label: "Medium" },
  HARD: { chip: "bg-red-950 border border-red-900 text-red-400", label: "Hard" },
};

export default function ContestProblemPage() {
  const { id: contestId, problemId } = useParams<{
    id: string;
    problemId: string;
  }>();
  const searchParams = useSearchParams();
  const isVirtual = searchParams.get("virtual") === "1";
  const router = useRouter();
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [contestInfo, setContestInfo] = useState<{
    index: string;
    points: number;
    userStatus: "solved" | "unsolved";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId || !problemId) return;

    apiFetch(
      `${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${contestId}/problems/${problemId}`,
      { credentials: "include" },
    )
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          router.replace(
            `/auth?redirect=/contests/${contestId}/problems/${problemId}`,
          );
          return;
        }
        if (!res.ok) throw new Error("not_found");
        return res.json();
      })
      .then((d) => {
        if (!d) return;
        const cp: ContestProblemResponse["problem"] = d.data.problem;
        const p = cp.problem;

        const samples: SampleTestCase[] = p.testCases.map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isSample: true as const,
          points: 0,
        }));

        setProblem({
          id: p.id,
          title: p.title,
          slug: p.slug,
          difficulty: p.difficulty,
          statement: p.statement,
          tags: p.tags,
          timeLimitMs: p.timeLimitMs,
          memoryLimitKb: p.memoryLimitKb,
          testCases: samples,
        });

        setContestInfo({
          index: cp.index,
          points: cp.points,
          userStatus: cp.userStatus,
        });
      })
      .catch((e) => {
        if (e.message !== "not_found") {
          setError("Failed to load problem");
        } else {
          setError("Problem not found in this contest");
        }
      })
      .finally(() => setLoading(false));
  }, [contestId, problemId, router]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!problem || !contestInfo) return null;

  const ds = DIFF_STYLES[problem.difficulty] ?? DIFF_STYLES.MEDIUM;
  const letter = String.fromCharCode(
    65 + (contestInfo.index.charCodeAt(0) - 65),
  );

  return (
    <>
      <Nav />
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          overflow: "hidden",
          paddingTop: 70,
        }}
      >
        {/* Contest-aware breadcrumb */}
        <div
          style={{
            borderBottom: "1px solid #1e1e1e",
            padding: "0 1.25rem",
            height: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            color: "#666",
          }}
        >
          <Link
            href={isVirtual ? `/contests/${contestId}/virtual` : `/contests/${contestId}`}
            style={{
              color: "#666",
              textDecoration: "none",
              transition: "color .12s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
          >
            {isVirtual ? "← Virtual" : "← Contest"}
          </Link>
          <span style={{ color: "#2e2e2e" }}>/</span>
          <span style={{ color: "#f0f0f0", maxWidth: 300 }} className="truncate">
            {letter}. {problem.title}
          </span>
          <span
            className={ds.chip}
            style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px" }}
          >
            {ds.label}
          </span>
          <span style={{ fontSize: 11, color: "#666", marginLeft: 4 }}>
            {contestInfo.points} pts
          </span>
          {contestInfo.userStatus === "solved" && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#4ade80",
                background: "#0d2e16",
                border: "1px solid #1a5c2d",
                padding: "2px 8px",
                borderRadius: 2,
                marginLeft: "auto",
              }}
            >
              Solved
            </span>
          )}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 16,
              fontSize: 11,
              color: "#333",
            }}
          >
            <span>TL: {problem.timeLimitMs}ms</span>
            <span>ML: {Math.round(problem.memoryLimitKb / 1024)}MB</span>
          </div>
        </div>

        {/* Split pane */}
        <div
          className="grid grid-cols-2 overflow-hidden"
          style={{ height: "calc(100vh - 110px)" }}
        >
          <ProblemPanel problem={problem} />
          <EditorPanel
            problemId={problem.id}
            samples={problem.testCases}
            submitEndpoint={`${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${contestId}/problems/${problemId}`}
          />
        </div>
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <Nav />
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          paddingTop: 70,
        }}
      >
        <div
          style={{
            height: 40,
            borderBottom: "1px solid #1e1e1e",
            display: "flex",
            alignItems: "center",
            padding: "0 1.25rem",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 80,
              height: 10,
              background: "#111",
              borderRadius: 2,
              animation: "pulse 1.5s ease infinite",
            }}
          />
          <div
            style={{
              width: 120,
              height: 10,
              background: "#111",
              borderRadius: 2,
              animation: "pulse 1.5s ease infinite",
              animationDelay: "0.1s",
            }}
          />
        </div>
        <div className="grid grid-cols-2" style={{ height: "calc(100vh - 110px)" }}>
          <div style={{ borderRight: "1px solid #1e1e1e", padding: "2rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 14,
                  background: "#111",
                  borderRadius: 2,
                  marginBottom: 12,
                  width: `${70 + i * 5}%`,
                  animation: "pulse 1.5s ease infinite",
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
          <div style={{ padding: "2rem" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 14,
                  background: "#111",
                  borderRadius: 2,
                  marginBottom: 12,
                  width: `${60 + i * 8}%`,
                  animation: "pulse 1.5s ease infinite",
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <>
      <Nav />
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "#ff4d4d",
            border: "1px solid #5c1a1a",
            background: "#2d0d0d",
            padding: "12px 24px",
            borderRadius: 2,
          }}
        >
          {error === "Problem not found in this contest"
            ? "404 · Problem not found in this contest"
            : "Error loading problem"}
        </div>
      </div>
    </>
  );
}
