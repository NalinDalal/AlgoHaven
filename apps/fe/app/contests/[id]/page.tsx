"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { useContestLeaderboard } from "@/hooks/useContestLeaderboard";

interface ContestDetails {
  id: string;
  title: string;
  slug: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "live" | "past";
  participantCount: number;
  isRated: boolean;
  isPractice: boolean;
  registrationOpen: boolean;
  problems: {
    id: string;
    index: string;
    points: number;
    problem: { id: string; title: string; difficulty: string };
  }[];
}

interface UserInfo {
  id: string;
  username: string;
}

export default function ContestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [contest, setContest] = useState<ContestDetails | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  const { entries, userRank, isFrozen, connectionStatus, refresh } =
    useContestLeaderboard({
      contestId: id,
      pollFallback: true,
      pollInterval: 5000,
    });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contestRes, meRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${id}`),
          fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/me`, {
            credentials: "include",
          }),
        ]);

        if (!contestRes.ok) {
          if (contestRes.status === 404) {
            setError("Contest not found");
            return;
          }
          throw new Error("Failed to fetch contest");
        }

        const contestData = await contestRes.json();
        setContest(contestData.data?.contest);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.data?.user);
        }
      } catch (err) {
        setError("Failed to load contest");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleRegister = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${id}/register`,
        { method: "POST", credentials: "include" },
      );
      if (res.ok) {
        setRegistered(true);
      }
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <span className="font-mono text-[13px] text-zinc-600 flex items-center gap-2.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#e8ff47] animate-pulse" />
            Loading contest...
          </span>
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
            404 · Contest not found
          </div>
          <Link
            href="/contests"
            className="text-xs text-zinc-600 hover:text-[#e8ff47]"
          >
            ← Back to contests
          </Link>
        </div>
      </>
    );
  }

  const getTimeRemaining = () => {
    const now = new Date();
    const end = new Date(contest.endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-[#0a0a0a]" style={{ paddingTop: 70 }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 text-xs text-zinc-600 font-mono mb-4">
            <Link href="/contests" className="hover:text-[#e8ff47]">
              Contests
            </Link>
            <span>/</span>
            <span className="text-zinc-400">{contest.title}</span>
          </div>

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100 font-mono mb-2">
                {contest.title}
              </h1>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span
                  className={`px-2 py-1 rounded ${contest.status === "live" ? "bg-green-900 text-green-400" : contest.status === "upcoming" ? "bg-blue-900 text-blue-400" : "bg-zinc-800 text-zinc-500"}`}
                >
                  {contest.status.toUpperCase()}
                </span>
                <span className="text-zinc-500">{getTimeRemaining()}</span>
                <span className="text-zinc-600">
                  {contest.participantCount} participants
                </span>
                {contest.isRated && (
                  <span className="text-amber-500">Rated</span>
                )}
                {contest.isPractice && (
                  <span className="text-zinc-500">Practice</span>
                )}
              </div>
            </div>

            {contest.status !== "past" && (
              <button
                onClick={handleRegister}
                disabled={registering || registered}
                className={`px-6 py-2.5 rounded font-mono text-sm font-bold transition-colors ${
                  registered
                    ? "bg-green-900 text-green-400 border border-green-800"
                    : "bg-[#e8ff47] text-black hover:bg-[#c8df2a]"
                }`}
              >
                {registered
                  ? "Registered"
                  : registering
                    ? "Registering..."
                    : "Register"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-[#111] border border-[#1e1e1e] rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
                  <h2 className="font-mono text-sm font-bold text-zinc-300">
                    Problems
                  </h2>
                </div>
                <div className="divide-y divide-[#1e1e1e]">
                  {contest.problems.length === 0 ? (
                    <div className="px-4 py-8 text-center text-zinc-600 font-mono text-sm">
                      {contest.status === "upcoming"
                        ? "Problems will be revealed when contest starts"
                        : "No problems available"}
                    </div>
                  ) : (
                    contest.problems.map((p, i) => (
                      <Link
                        key={p.id}
                        href={`/contests/${id}/problems/${p.problem.id}`}
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
                            className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                              p.problem.difficulty === "EASY"
                                ? "bg-green-900 text-green-400"
                                : p.problem.difficulty === "MEDIUM"
                                  ? "bg-yellow-900 text-yellow-400"
                                  : "bg-red-900 text-red-400"
                            }`}
                          >
                            {p.problem.difficulty}
                          </span>
                          <span className="font-mono text-xs text-zinc-600">
                            {p.points} pts
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[#111] border border-[#1e1e1e] rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
                  <h2 className="font-mono text-sm font-bold text-zinc-300">
                    Leaderboard
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-green-500" : connectionStatus === "fallback" ? "bg-yellow-500" : "bg-zinc-600"}`}
                    />
                    <span className="font-mono text-[10px] text-zinc-600">
                      {connectionStatus === "connected"
                        ? "Live"
                        : connectionStatus === "fallback"
                          ? "Polling"
                          : "Connecting"}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-[#1e1e1e] max-h-96 overflow-y-auto">
                  {entries.length === 0 ? (
                    <div className="px-4 py-8 text-center text-zinc-600 font-mono text-sm">
                      No participants yet
                    </div>
                  ) : (
                    entries.slice(0, 20).map((entry) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between px-4 py-2 ${entry.userId === user?.id ? "bg-[#1a1a1a]" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-mono text-xs font-bold w-6 ${
                              entry.rank <= 3
                                ? "text-amber-400"
                                : "text-zinc-500"
                            }`}
                          >
                            #{entry.rank}
                          </span>
                          <span className="font-mono text-sm text-zinc-300">
                            {entry.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-zinc-400">
                            {entry.solved} solved
                          </span>
                          <span className="font-mono text-xs font-bold text-[#e8ff47]">
                            {entry.totalPoints}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {userRank && (
                  <div className="px-4 py-2 border-t border-[#1e1e1e] bg-[#161616]">
                    <span className="font-mono text-xs text-zinc-500">
                      Your rank:{" "}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#e8ff47]">
                      #{userRank}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
