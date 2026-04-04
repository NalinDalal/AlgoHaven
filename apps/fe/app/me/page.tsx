"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

interface RatingPoint {
  contestId: string;
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
  contest: { id: string; title: string; slug: string } | null;
}

interface MeData {
  id: string;
  email: string;
  username: string | null;
  role: string;
  createdAt: string;
  currentRating: number | null;
  rankTier: string;
  rankColor: string;
  rankBg: string;
  maxRating: number | null;
  ratingDelta: number;
  percentile: number | null;
  totalSubmissions: number;
  acceptedCount: number;
  acceptanceRate: number;
  solvedCount: number;
  difficultyBreakdown: { EASY: number; MEDIUM: number; HARD: number };
  topTags: { tag: string; count: number }[];
  contestsEntered: number;
  verdictBreakdown: Record<string, number>;
  languageBreakdown: { language: string; count: number }[];
  heatmap: Record<string, { count: number; accepted: number }>;
  streak: { current: number; longest: number };
  last30Days: { submissions: number; accepted: number };
  contestPerformance: {
    totalRated: number;
    bestRank: number | null;
    avgRank: number | null;
    totalWins: number;
  };
  badges: { id: string; name: string; desc: string; icon: string }[];
  recentSubmissions: RecentSubmission[];
  ratingHistory: RatingPoint[];
  stats: { daysSinceJoined: number; avgSubmissionsPerDay: string };
}

const VERDICT_STYLE: Record<string, { label: string; cls: string }> = {
  ACCEPTED: { label: "AC", cls: "text-emerald-400" },
  WRONG_ANSWER: { label: "WA", cls: "text-red-400" },
  TLE: { label: "TLE", cls: "text-amber-400" },
  MLE: { label: "MLE", cls: "text-orange-400" },
  RUNTIME_ERROR: { label: "RE", cls: "text-rose-400" },
  COMPILE_ERROR: { label: "CE", cls: "text-zinc-400" },
  QUEUED: { label: "Q", cls: "text-zinc-500" },
  RUNNING: { label: "...", cls: "text-sky-400" },
};

function verdictStyle(status: string) {
  return VERDICT_STYLE[status] ?? { label: status, cls: "text-zinc-400" };
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CircleStat({
  value,
  label,
  sub,
  color,
  size = 100,
}: {
  value: string | number;
  label: string;
  sub?: string;
  color?: string;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent =
    typeof value === "number" ? Math.min(100, (value / (value + 5)) * 100) : 0;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#222"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color || "#4ade80"}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl font-bold"
            style={{ color: color || "#fff" }}
          >
            {value}
          </span>
        </div>
      </div>
      <span className="text-xs text-zinc-500 font-mono uppercase">{label}</span>
      {sub && <span className="text-[10px] text-zinc-600">{sub}</span>}
    </div>
  );
}

function BadgeDisplay({ badges }: { badges: MeData["badges"] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <div
          key={b.id}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-full"
          title={b.desc}
        >
          <span>{b.icon}</span>
          <span className="text-xs text-zinc-300 font-mono">{b.name}</span>
        </div>
      ))}
    </div>
  );
}

function Heatmap({ data }: { data: MeData["heatmap"] }) {
  const days = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayData = data[dateStr] || { count: 0, accepted: 0 };
    days.push({ date: dateStr, ...dayData, day: d.getDay() });
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const getMonth = (d: number) => months[new Date(d).getMonth()];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5 min-w-max">
        {[0, 1, 2, 3, 4, 5].map((week) => (
          <div key={week} className="flex flex-col gap-0.5">
            {days
              .filter((_, i) => Math.floor(i / 7) === week)
              .map((d, i) => {
                const intensity =
                  d.count === 0
                    ? 0
                    : d.count <= 2
                      ? 1
                      : d.count <= 5
                        ? 2
                        : d.count <= 10
                          ? 3
                          : 4;
                const colors = [
                  "#161616",
                  "#0f3d0f",
                  "#166b16",
                  "#229922",
                  "#2ec72e",
                  "#4ade80",
                ];
                return (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ background: colors[intensity] }}
                    title={`${d.date}: ${d.count} submissions`}
                  />
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MePage() {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/me`, {
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error("not_authed");
        return r.json();
      })
      .then((data) => {
        if (data.status !== "success") throw new Error("not_authed");
        setMe(data.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

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

  if (error || !me) {
    return (
      <>
        <Nav />
        <div
          className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"
          style={{ paddingTop: "60px" }}
        >
          <div className="text-red-400 text-sm font-mono">
            Not logged in or session expired.
          </div>
        </div>
      </>
    );
  }

  const hasRating = me.currentRating !== null;

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
                style={{ background: `${me.rankColor}20`, color: me.rankColor }}
              >
                {(me.username ?? me.email ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-100">
                    {me.username ?? me.email}
                  </h1>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded border"
                    style={{
                      color: me.rankColor,
                      borderColor: `${me.rankColor}44`,
                      background: me.rankBg,
                    }}
                  >
                    {me.rankTier}
                  </span>
                </div>
                <p className="text-sm text-zinc-500">{me.email}</p>
              </div>
            </div>
            {me.badges && me.badges.length > 0 && (
              <BadgeDisplay badges={me.badges} />
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
                      style={{ color: me.rankColor }}
                    >
                      {me.currentRating}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Current Rating
                    </div>
                  </div>
                  {me.ratingDelta !== 0 && (
                    <div
                      className={`text-xl font-bold ${me.ratingDelta > 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {me.ratingDelta > 0 ? "+" : ""}
                      {me.ratingDelta}
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-300">
                      {me.maxRating ?? "—"}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Max Rating</div>
                  </div>
                  {me.percentile !== null && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-zinc-300">
                        {me.percentile}%
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">Top</div>
                    </div>
                  )}
                </div>
                {me.streak && me.streak.current > 0 && (
                  <div className="flex items-center gap-2 text-orange-400">
                    <span>🔥</span>
                    <span className="font-bold">
                      {me.streak.current} day streak
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Circular Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
            <CircleStat value={me.solvedCount} label="Solved" color="#4ade80" />
            <CircleStat
              value={me.totalSubmissions}
              label="Submissions"
              color="#60a5fa"
            />
            <CircleStat
              value={`${me.acceptanceRate}%`}
              label="Accept %"
              color="#fbbf24"
            />
            <CircleStat
              value={me.contestsEntered}
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
                  {me.difficultyBreakdown?.EASY ?? 0}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Easy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400">
                  {me.difficultyBreakdown?.MEDIUM ?? 0}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">
                  {me.difficultyBreakdown?.HARD ?? 0}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Hard</div>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          {me.heatmap && Object.keys(me.heatmap).length > 0 && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-5">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                Submission Activity
              </h2>
              <Heatmap data={me.heatmap} />
            </div>
          )}

          {/* Top Tags */}
          {me.topTags && me.topTags.length > 0 && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-5">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                Top Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {me.topTags.map((t) => (
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
          {me.contestPerformance && me.contestPerformance.totalRated > 0 && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-5">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                Contest Performance
              </h2>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-zinc-100">
                    {me.contestPerformance.totalRated}
                  </div>
                  <div className="text-xs text-zinc-500">Contests</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">
                    #{me.contestPerformance.bestRank ?? "—"}
                  </div>
                  <div className="text-xs text-zinc-500">Best Rank</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-zinc-300">
                    #{me.contestPerformance.avgRank ?? "—"}
                  </div>
                  <div className="text-xs text-zinc-500">Avg Rank</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400">
                    {me.contestPerformance.totalWins}
                  </div>
                  <div className="text-xs text-zinc-500">Wins</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
              Recent Submissions
            </h2>
            {(me.recentSubmissions ?? []).length === 0 ? (
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
                    {me.recentSubmissions.map((s) => {
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
