"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { apiFetch } from "@/lib/apiFetch";

interface ContestDetails {
  id: string;
  title: string;
  slug: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "live" | "past";
  isPractice: boolean;
  problems: {
    id: string;
    index: string;
    points: number;
    problem: { id: string; title: string; difficulty: string };
  }[];
}

const VIRTUAL_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

function formatTime(ms: number) {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const DIFF_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  EASY: { color: "#4ade80", bg: "#0d2e16", border: "#1a5c2d" },
  MEDIUM: { color: "#ffd700", bg: "#1a1a0d", border: "#4a4a1a" },
  HARD: { color: "#ff4d4d", bg: "#2d0d0d", border: "#5c1a1a" },
};

export default function VirtualContestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contest, setContest] = useState<ContestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(VIRTUAL_DURATION_MS);

  useEffect(() => {
    apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setContest(data.data?.contest);
        } else {
          setError("Contest not found");
        }
      })
      .catch(() => setError("Failed to load contest"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!started || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = VIRTUAL_DURATION_MS - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [started, startTime]);

  const handleStart = () => {
    setStartTime(Date.now());
    setStarted(true);
  };

  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <span className="font-mono text-[13px] text-zinc-600">Loading...</span>
        </div>
      </>
    );
  }

  if (error || !contest) {
    return (
      <>
        <Nav />
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-mono gap-3">
          <div className="text-[13px] text-red-400 border border-red-900 bg-red-950 px-6 py-2.5 rounded-sm">
            {error || "Contest not found"}
          </div>
          <Link href="/contests" className="text-xs text-zinc-600 hover:text-[#e8ff47]">
            ← Back to contests
          </Link>
        </div>
      </>
    );
  }

  if (!started) {
    return (
      <>
        <Nav />
        <div className="min-h-screen bg-[#0a0a0a]" style={{ paddingTop: 70 }}>
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="flex items-center gap-2 text-xs text-zinc-600 font-mono mb-6">
              <Link href="/contests" className="hover:text-[#e8ff47]">Contests</Link>
              <span>/</span>
              <Link href={`/contests/${id}`} className="hover:text-[#e8ff47]">{contest.title}</Link>
              <span>/</span>
              <span className="text-purple-400">Virtual</span>
            </div>

            <div className="bg-[#111] border border-purple-900 rounded-lg p-8 text-center">
              <div className="text-purple-400 font-mono text-sm mb-4">VIRTUAL CONTEST</div>
              <h1 className="text-2xl font-bold text-zinc-100 font-mono mb-4">{contest.title}</h1>
              <p className="text-zinc-500 font-mono text-sm mb-6">
                You have {VIRTUAL_DURATION_MS / (1000 * 60 * 60)} hours to solve {contest.problems.length} problems.
                Timer starts when you click the button.
              </p>
              <div className="text-zinc-600 font-mono text-xs mb-8">
                {contest.problems.length} problems • {contest.problems.reduce((sum, p) => sum + p.points, 0)} total points
              </div>
              <button
                onClick={handleStart}
                className="px-8 py-3 rounded font-mono text-sm font-bold bg-purple-600 text-white hover:bg-purple-500 transition-colors"
              >
                Start Virtual Contest
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-[#0a0a0a]" style={{ paddingTop: 70 }}>
        {/* Timer bar */}
        <div className="fixed top-[50px] left-0 right-0 z-50 bg-[#111] border-b border-purple-900 px-6 py-2">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-purple-400 font-mono text-xs">VIRTUAL</span>
              <span className="text-zinc-400 font-mono text-sm">{contest.title}</span>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`font-mono text-lg font-bold ${
                  timeLeft < 300000 ? "text-red-400" : timeLeft < 1800000 ? "text-yellow-400" : "text-green-400"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Problems list */}
        <div className="max-w-4xl mx-auto px-6 py-8" style={{ marginTop: 40 }}>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e1e]">
              <h2 className="font-mono text-sm font-bold text-zinc-300">Problems</h2>
            </div>
            <div className="divide-y divide-[#1e1e1e]">
              {contest.problems.map((p, i) => {
                const ds = DIFF_STYLES[p.problem.difficulty] ?? DIFF_STYLES.MEDIUM;
                return (
                  <Link
                    key={p.id}
                    href={`/contests/${id}/problems/${p.problem.id}?virtual=1&start=${startTime}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#161616] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-zinc-500">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="font-mono text-sm text-zinc-300">
                        {p.problem.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 10,
                          fontWeight: 700,
                          color: ds.color,
                          background: ds.bg,
                          border: `1px solid ${ds.border}`,
                          padding: "2px 8px",
                          borderRadius: 2,
                        }}
                      >
                        {p.problem.difficulty}
                      </span>
                      <span className="font-mono text-xs text-zinc-600">
                        {p.points} pts
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {timeLeft <= 0 && (
            <div className="mt-6 bg-red-950 border border-red-900 rounded-lg p-6 text-center">
              <div className="text-red-400 font-mono text-sm font-bold mb-2">Time&apos;s Up!</div>
              <p className="text-zinc-500 font-mono text-xs">
                Your virtual contest has ended. Your submissions have been saved.
              </p>
              <Link
                href={`/contests/${id}`}
                className="inline-block mt-4 text-[#e8ff47] font-mono text-xs hover:underline"
              >
                View Contest Results
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
