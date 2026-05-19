"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Nav from "@/components/Nav";

interface RatingPoint {
  contestTitle: string;
  contestSlug: string;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  rank: number;
  createdAt: string;
}

interface RecentSubmission {
  id: string;
  status: string;
  language: string;
  executionTimeMs: number | null;
  memoryUsedKb: number | null;
  createdAt: string;
  problem: { id: string; title: string; slug: string; difficulty: string };
}

interface ProfileData {
  id: string;
  username: string | null;
  role: string;
  createdAt: string;
  currentRating: number | null;
  maxRating: number | null;
  ratingDelta: number;
  rankTier: string;
  rankColor: string;
  rankBg: string;
  totalSubmissions: number;
  acceptedCount: number;
  acceptanceRate: number;
  solvedCount: number;
  difficultyBreakdown: { EASY: number; MEDIUM: number; HARD: number };
  topTags: { tag: string; count: number }[];
  contestsEntered: number;
  contestPerformance: {
    totalRated: number;
    bestRank: number | null;
    avgRank: number | null;
    totalWins: number;
  };
  badges: { id: string; name: string; desc: string; icon: string }[];
  recentSubmissions: RecentSubmission[];
  ratingHistory: RatingPoint[];
}

const VERDICT_STYLE: Record<string, { label: string; cls: string }> = {
  ACCEPTED: { label: "AC", cls: "text-emerald-400" },
  WRONG_ANSWER: { label: "WA", cls: "text-red-400" },
  TLE: { label: "TLE", cls: "text-amber-400" },
  MLE: { label: "MLE", cls: "text-orange-400" },
  RUNTIME_ERROR: { label: "RE", cls: "text-rose-400" },
  COMPILE_ERROR: { label: "CE", cls: "text-yellow-400" },
  PENDING: { label: "...", cls: "text-zinc-500" },
};

function verdictStyle(s: string) {
  return VERDICT_STYLE[s] ?? { label: s, cls: "text-zinc-500" };
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CircleStat({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-lg font-bold"
        style={{
          border: `3px solid ${color}`,
          color,
          background: `${color}10`,
        }}
      >
        {value}
      </div>
      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

function BadgeDisplay({
  badges,
}: {
  badges: { id: string; name: string; desc: string; icon: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 bg-[#151515] border border-[#252525] rounded-lg text-sm cursor-pointer hover:bg-[#1a1a1a] transition-colors"
      >
        <span className="text-xs">{badges.length}</span>
        <span className="text-zinc-400">🏅</span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 w-64 bg-[#151515] border border-[#252525] rounded-xl p-3 shadow-2xl">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-[#1a1a1a]"
              >
                <span className="text-xl">{b.icon}</span>
                <div>
                  <div className="text-xs font-bold text-zinc-200">
                    {b.name}
                  </div>
                  <div className="text-[10px] text-zinc-500">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const RATING_COLOR: Record<string, string> = {
  "Legendary Grandmaster": "#ff0000",
  "International Grandmaster": "#ff0000",
  Grandmaster: "#ff0000",
  Master: "#ff8c00",
  "International Master": "#ff8c00",
  "Candidate Master": "#aa00aa",
  Expert: "#0000ff",
  Specialist: "#03a89e",
  Pupil: "#008000",
  Newbie: "#808080",
  Unrated: "#888888",
};

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    fetch(
      `${process.env.NEXT_PUBLIC_BE_URL}/api/profile/${encodeURIComponent(username)}`,
    )
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.message || "User not found");
        }
        return r.json();
      })
      .then((data) => {
        if (data.status !== "success") throw new Error("User not found");
        setProfile(data.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return (
      <>
        <Nav />
        <div
          className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"
          style={{ paddingTop: "60px" }}
        >
          <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-100 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Nav />
        <div
          className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"
          style={{ paddingTop: "60px" }}
        >
          <div className="text-zinc-500 text-sm font-mono">
            {error || "User not found."}
          </div>
        </div>
      </>
    );
  }

  const hasRating = profile.currentRating !== null;

  return (
    <>
      <Nav />
      <div
        className="min-h-screen bg-[#0a0a0a]"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          paddingTop: "60px",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold"
                style={{
                  background: `${profile.rankColor}20`,
                  color: profile.rankColor,
                }}
              >
                {(profile.username ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-100">
                    {profile.username}
                  </h1>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded border"
                    style={{
                      color: profile.rankColor,
                      borderColor: `${profile.rankColor}44`,
                      background: profile.rankBg,
                    }}
                  >
                    {profile.rankTier}
                  </span>
                  {profile.role === "ADMIN" && (
                    <span className="text-[10px] text-amber-500 bg-amber-950 border border-amber-900 px-1.5 py-0.5 rounded">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-600">
                  Joined{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            {profile.badges && profile.badges.length > 0 && (
              <BadgeDisplay badges={profile.badges} />
            )}
          </div>

          {/* Rating Card */}
          {hasRating && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div
                      className="text-4xl font-bold"
                      style={{ color: profile.rankColor }}
                    >
                      {profile.currentRating}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Current Rating
                    </div>
                  </div>
                  {profile.ratingDelta !== 0 && (
                    <div
                      className={`text-xl font-bold ${profile.ratingDelta > 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {profile.ratingDelta > 0 ? "+" : ""}
                      {profile.ratingDelta}
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-300">
                      {profile.maxRating ?? "—"}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Max Rating</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Circular Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
            <CircleStat
              value={profile.solvedCount}
              label="Solved"
              color="#4ade80"
            />
            <CircleStat
              value={profile.totalSubmissions}
              label="Submissions"
              color="#60a5fa"
            />
            <CircleStat
              value={`${profile.acceptanceRate}%`}
              label="Accept %"
              color="#fbbf24"
            />
            <CircleStat
              value={profile.contestsEntered}
              label="Contests"
              color="#a78bfa"
            />
          </div>

          {/* Difficulty Breakdown */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
              Difficulty Breakdown
            </h2>
            <div className="flex justify-around">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">
                  {profile.difficultyBreakdown?.EASY ?? 0}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Easy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400">
                  {profile.difficultyBreakdown?.MEDIUM ?? 0}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">
                  {profile.difficultyBreakdown?.HARD ?? 0}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Hard</div>
              </div>
            </div>
          </div>

          {/* Top Tags */}
          {profile.topTags && profile.topTags.length > 0 && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-5">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                Top Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.topTags.map((t) => (
                  <span
                    key={t.tag}
                    className="px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded text-sm text-zinc-300"
                  >
                    {t.tag} <span className="text-zinc-500">×{t.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contest Performance */}
          {profile.contestPerformance &&
            profile.contestPerformance.totalRated > 0 && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                  Contest Performance
                </h2>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-zinc-100">
                      {profile.contestPerformance.totalRated}
                    </div>
                    <div className="text-xs text-zinc-500">Contests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">
                      #{profile.contestPerformance.bestRank ?? "—"}
                    </div>
                    <div className="text-xs text-zinc-500">Best Rank</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-300">
                      #{profile.contestPerformance.avgRank ?? "—"}
                    </div>
                    <div className="text-xs text-zinc-500">Avg Rank</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-400">
                      {profile.contestPerformance.totalWins}
                    </div>
                    <div className="text-xs text-zinc-500">Wins</div>
                  </div>
                </div>
              </div>
            )}

          {/* Rating History */}
          {profile.ratingHistory && profile.ratingHistory.length > 0 && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-5">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                Rating History
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-600 border-b border-[#222]">
                      <th className="text-left py-2 pr-4">Contest</th>
                      <th className="text-right py-2 pr-4">Before</th>
                      <th className="text-right py-2 pr-4">After</th>
                      <th className="text-right py-2 pr-4">Δ</th>
                      <th className="text-right py-2">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.ratingHistory.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-[#1a1a1a] hover:bg-[#151515]"
                      >
                        <td className="py-2 pr-4 text-zinc-300">
                          {r.contestTitle}
                        </td>
                        <td className="py-2 pr-4 text-right text-zinc-400">
                          {r.ratingBefore}
                        </td>
                        <td className="py-2 pr-4 text-right font-bold text-zinc-200">
                          {r.ratingAfter}
                        </td>
                        <td
                          className={`py-2 pr-4 text-right font-bold ${r.delta > 0 ? "text-emerald-400" : r.delta < 0 ? "text-red-400" : "text-zinc-500"}`}
                        >
                          {r.delta > 0 ? "+" : ""}
                          {r.delta}
                        </td>
                        <td className="py-2 text-right text-zinc-400">
                          #{r.rank}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
              Recent Submissions
            </h2>
            {(profile.recentSubmissions ?? []).length === 0 ? (
              <div className="text-zinc-600 text-sm py-4 text-center">
                No submissions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-600 border-b border-[#222]">
                      <th className="text-left py-2 pr-4">When</th>
                      <th className="text-left py-2 pr-4">Problem</th>
                      <th className="text-left py-2 pr-4">Status</th>
                      <th className="text-left py-2 pr-4">Lang</th>
                      <th className="text-right py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.recentSubmissions.map((s) => {
                      const vs = verdictStyle(s.status);
                      return (
                        <tr
                          key={s.id}
                          className="border-b border-[#1a1a1a] hover:bg-[#151515]"
                        >
                          <td className="py-2 pr-4 text-zinc-500">
                            {fmtDate(s.createdAt)}
                          </td>
                          <td className="py-2 pr-4 text-zinc-300">
                            {s.problem.title}
                          </td>
                          <td className={`py-2 pr-4 font-bold ${vs.cls}`}>
                            {vs.label}
                          </td>
                          <td className="py-2 pr-4 text-zinc-500">
                            {s.language}
                          </td>
                          <td className="py-2 text-right text-zinc-600">
                            {s.executionTimeMs
                              ? `${Math.round(s.executionTimeMs)}ms`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
