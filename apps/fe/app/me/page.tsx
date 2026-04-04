"use client";
import { useEffect, useState, useRef } from "react";
import Nav from "@/components/Nav";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  maxRating: number | null;
  totalSubmissions: number;
  acceptedCount: number;
  acceptanceRate: number;
  solvedCount: number;
  contestsEntered: number;
  verdictBreakdown: Record<string, number>;
  languageBreakdown: { language: string; count: number }[];
  recentSubmissions: RecentSubmission[];
  ratingHistory: RatingPoint[];
}

// ── Verdict helpers ───────────────────────────────────────────────────────────

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

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: "text-emerald-400",
  MEDIUM: "text-amber-400",
  HARD: "text-red-400",
};

function verdictStyle(status: string) {
  return VERDICT_STYLE[status] ?? { label: status, cls: "text-zinc-400" };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(ms: number | null) {
  if (ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

// ── Rating graph (pure SVG, no library) ──────────────────────────────────────

function RatingGraph({ history }: { history: RatingPoint[] }) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-600 font-mono text-sm">
        No rated contests yet
      </div>
    );
  }

  const W = 600,
    H = 160,
    PAD = { t: 12, r: 16, b: 28, l: 44 };
  const ratings = history.map((r) => r.ratingAfter);
  const minR = Math.min(...ratings, history[0].ratingBefore) - 50;
  const maxR = Math.max(...ratings) + 80;

  // Add a virtual "start" point using ratingBefore of first contest
  const points = [
    { rating: history[0].ratingBefore, label: null },
    ...history.map((r) => ({ rating: r.ratingAfter, label: r })),
  ];

  const cx = (i: number) =>
    PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
  const cy = (r: number) =>
    PAD.t + ((maxR - r) / (maxR - minR)) * (H - PAD.t - PAD.b);

  const polyline = points.map((p, i) => `${cx(i)},${cy(p.rating)}`).join(" ");

  // Colour zones (Codeforces bands)
  const ZONES = [
    { min: 0, max: 1200, color: "#808080" },
    { min: 1200, max: 1400, color: "#008000" },
    { min: 1400, max: 1600, color: "#03a89e" },
    { min: 1600, max: 1900, color: "#0000ff" },
    { min: 1900, max: 2100, color: "#aa00aa" },
    { min: 2100, max: 3500, color: "#ff8c00" },
  ];

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Rating band fills */}
      {ZONES.map((z) => {
        const top = Math.min(H - PAD.b, Math.max(PAD.t, cy(z.max)));
        const bottom = Math.min(H - PAD.b, Math.max(PAD.t, cy(z.min)));
        if (bottom <= top) return null;
        return (
          <rect
            key={z.min}
            x={PAD.l}
            y={top}
            width={W - PAD.l - PAD.r}
            height={bottom - top}
            fill={z.color}
            opacity={0.07}
          />
        );
      })}

      {/* Y-axis grid lines */}
      {[1200, 1400, 1600, 1900, 2100].map((r) => {
        if (r < minR || r > maxR) return null;
        return (
          <g key={r}>
            <line
              x1={PAD.l}
              y1={cy(r)}
              x2={W - PAD.r}
              y2={cy(r)}
              stroke="#333"
              strokeWidth={0.5}
              strokeDasharray="3 3"
            />
            <text
              x={PAD.l - 6}
              y={cy(r) + 4}
              textAnchor="end"
              fontSize={9}
              fill="#555"
            >
              {r}
            </text>
          </g>
        );
      })}

      {/* Rating line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#4ade80"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.9}
      />

      {/* Area fill under line */}
      <polygon
        points={`${cx(0)},${H - PAD.b} ${polyline} ${cx(points.length - 1)},${H - PAD.b}`}
        fill="#4ade80"
        opacity={0.06}
      />

      {/* Data points */}
      {points.map((p, i) => {
        if (p.label === null) return null;
        const isHov = hovered === i;
        return (
          <g key={i}>
            <circle
              cx={cx(i)}
              cy={cy(p.rating)}
              r={isHov ? 5 : 3}
              fill={
                p.rating >= (points[i - 1]?.rating ?? p.rating)
                  ? "#4ade80"
                  : "#f87171"
              }
              stroke="#0a0a0a"
              strokeWidth={1.5}
              style={{ cursor: "pointer", transition: "r 0.1s" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {isHov && p.label && (
              <g>
                <rect
                  x={cx(i) - 72}
                  y={cy(p.rating) - 38}
                  width={144}
                  height={30}
                  rx={4}
                  fill="#161616"
                  stroke="#333"
                  strokeWidth={0.5}
                />
                <text
                  x={cx(i)}
                  y={cy(p.rating) - 24}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#a1a1aa"
                >
                  {p.label.contestTitle.length > 22
                    ? p.label.contestTitle.slice(0, 22) + "…"
                    : p.label.contestTitle}
                </text>
                <text
                  x={cx(i)}
                  y={cy(p.rating) - 13}
                  textAnchor="middle"
                  fontSize={10}
                  fill={p.label.delta >= 0 ? "#4ade80" : "#f87171"}
                  fontWeight="600"
                >
                  {p.rating} ({p.label.delta >= 0 ? "+" : ""}
                  {p.label.delta})
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* X-axis labels — first and last */}
      {history.length > 0 && (
        <>
          <text
            x={cx(1)}
            y={H - 6}
            textAnchor="middle"
            fontSize={9}
            fill="#555"
          >
            {fmtDate(history[0].createdAt)}
          </text>
          {history.length > 1 && (
            <text
              x={cx(points.length - 1)}
              y={H - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#555"
            >
              {fmtDate(history[history.length - 1].createdAt)}
            </text>
          )}
        </>
      )}
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-lg px-4 py-3 flex flex-col gap-0.5">
      <span className="text-[11px] text-zinc-600 font-mono uppercase tracking-widest">
        {label}
      </span>
      <span className="text-xl font-mono font-bold text-zinc-100 leading-tight">
        {value}
      </span>
      {sub && (
        <span className="text-[11px] text-zinc-500 font-mono">{sub}</span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MePage() {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/me`, {
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error("not_authed");
        return r.json();
      })
      .then((data) => {
        if (data.status !== "success") throw new Error("not_authed");
        const user = data.data.user;
        setMe({
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          createdAt: new Date().toISOString(),
          currentRating: null,
          rankTier: "Newbie",
          rankColor: "#888888",
          maxRating: null,
          totalSubmissions: 0,
          acceptedCount: 0,
          acceptanceRate: 0,
          solvedCount: 0,
          contestsEntered: 0,
          verdictBreakdown: {},
          languageBreakdown: [],
          recentSubmissions: [],
          ratingHistory: [],
        });
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !me) {
    return (
      <>
        <Nav />
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="font-mono text-sm text-red-400 border border-red-900 bg-red-950/30 rounded-lg px-6 py-4">
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
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="flex items-start gap-6">
            {/* Avatar placeholder — initials */}
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 border border-[#2a2a2a]"
              style={{
                background: "#161616",
                color: me.rankColor,
                textShadow: `0 0 20px ${me.rankColor}55`,
              }}
            >
              {(me.username ?? me.email).charAt(0).toUpperCase()}
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-zinc-100 truncate">
                  {me.username ?? me.email}
                </h1>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded border"
                  style={{
                    color: me.rankColor,
                    borderColor: `${me.rankColor}44`,
                    background: `${me.rankColor}12`,
                  }}
                >
                  {me.rankTier}
                </span>
                {me.role === "ADMIN" && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded border text-amber-400 border-amber-900 bg-amber-950/30">
                    ADMIN
                  </span>
                )}
              </div>
              <span className="text-sm text-zinc-500">{me.email}</span>
              <span className="text-xs text-zinc-600">
                Joined {fmtDate(me.createdAt)}
              </span>
            </div>
          </div>

          {/* ── Stats grid ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              label="Rating"
              value={
                hasRating ? (
                  <span style={{ color: me.rankColor }}>
                    {me.currentRating}
                  </span>
                ) : (
                  <span className="text-zinc-600 text-base">—</span>
                )
              }
              sub={me.maxRating ? `max ${me.maxRating}` : undefined}
            />
            <StatCard label="Solved" value={me.solvedCount} />
            <StatCard label="Contests" value={me.contestsEntered} />
            <StatCard
              label="Accept %"
              value={`${me.acceptanceRate}%`}
              sub={`${me.acceptedCount} / ${me.totalSubmissions}`}
            />
            <StatCard label="Submissions" value={me.totalSubmissions} />
            <StatCard
              label="Top lang"
              value={me.languageBreakdown[0]?.language ?? "—"}
              sub={
                me.languageBreakdown[0]
                  ? `${me.languageBreakdown[0].count} subs`
                  : undefined
              }
            />
          </div>

          {/* ── Rating graph ──────────────────────────────────────────────── */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
            <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
              Rating history
            </h2>
            <RatingGraph history={me.ratingHistory} />
          </div>

          {/* ── Bottom two-column ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Verdict breakdown */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                Verdict breakdown
              </h2>
              <div className="flex flex-col gap-2">
                {Object.entries(me.verdictBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([verdict, count]) => {
                    const vs = verdictStyle(verdict);
                    const pct =
                      me.totalSubmissions > 0
                        ? Math.round((count / me.totalSubmissions) * 100)
                        : 0;
                    return (
                      <div key={verdict} className="flex items-center gap-3">
                        <span
                          className={`w-10 text-right text-xs font-bold ${vs.cls}`}
                        >
                          {vs.label}
                        </span>
                        <div className="flex-1 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: vs.cls.includes("emerald")
                                ? "#4ade80"
                                : vs.cls.includes("red")
                                  ? "#f87171"
                                  : vs.cls.includes("amber")
                                    ? "#fbbf24"
                                    : vs.cls.includes("orange")
                                      ? "#fb923c"
                                      : vs.cls.includes("rose")
                                        ? "#fb7185"
                                        : vs.cls.includes("sky")
                                          ? "#38bdf8"
                                          : "#52525b",
                            }}
                          />
                        </div>
                        <span className="w-10 text-xs text-zinc-500 tabular-nums">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Language breakdown */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                Languages
              </h2>
              <div className="flex flex-col gap-2">
                {me.languageBreakdown.slice(0, 6).map(({ language, count }) => {
                  const pct =
                    me.totalSubmissions > 0
                      ? Math.round((count / me.totalSubmissions) * 100)
                      : 0;
                  return (
                    <div key={language} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-zinc-300 truncate">
                        {language}
                      </span>
                      <div className="flex-1 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-xs text-zinc-500 tabular-nums text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Recent submissions ────────────────────────────────────────── */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
            <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
              Recent submissions
            </h2>
            {me.recentSubmissions.length === 0 ? (
              <div className="text-zinc-600 text-sm py-4 text-center">
                No submissions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-600 border-b border-[#1e1e1e]">
                      <th className="text-left py-2 pr-3 font-normal">When</th>
                      <th className="text-left py-2 pr-3 font-normal">
                        Problem
                      </th>
                      <th className="text-left py-2 pr-3 font-normal hidden sm:table-cell">
                        Contest
                      </th>
                      <th className="text-left py-2 pr-3 font-normal">
                        Status
                      </th>
                      <th className="text-left py-2 pr-3 font-normal hidden md:table-cell">
                        Lang
                      </th>
                      <th className="text-right py-2 font-normal hidden md:table-cell">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {me.recentSubmissions.map((s) => {
                      const vs = verdictStyle(s.status);
                      return (
                        <tr
                          key={s.id}
                          className="border-b border-[#171717] hover:bg-[#161616] transition-colors"
                        >
                          <td className="py-2 pr-3 text-zinc-600 whitespace-nowrap">
                            {fmtDate(s.createdAt)}
                          </td>
                          <td className="py-2 pr-3 max-w-40">
                            <span className="text-zinc-300 truncate block">
                              {s.problem.title}
                            </span>
                            <span
                              className={`text-[10px] ${DIFFICULTY_STYLE[s.problem.difficulty] ?? "text-zinc-500"}`}
                            >
                              {s.problem.difficulty}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-zinc-500 hidden sm:table-cell max-w-30">
                            <span className="truncate block">
                              {s.contest?.title ?? (
                                <span className="text-zinc-700">practice</span>
                              )}
                            </span>
                          </td>
                          <td className={`py-2 pr-3 font-bold ${vs.cls}`}>
                            {vs.label}
                          </td>
                          <td className="py-2 pr-3 text-zinc-500 hidden md:table-cell">
                            {s.language}
                          </td>
                          <td className="py-2 text-right text-zinc-600 hidden md:table-cell tabular-nums">
                            {fmtTime(s.executionTimeMs)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Contest history table ─────────────────────────────────────── */}
          {me.ratingHistory.length > 0 && (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                Contest history
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-600 border-b border-[#1e1e1e]">
                      <th className="text-left py-2 pr-3 font-normal">
                        Contest
                      </th>
                      <th className="text-right py-2 pr-3 font-normal">Rank</th>
                      <th className="text-right py-2 pr-3 font-normal">
                        Rating
                      </th>
                      <th className="text-right py-2 font-normal">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...me.ratingHistory].reverse().map((r) => (
                      <tr
                        key={r.contestId}
                        className="border-b border-[#171717] hover:bg-[#161616] transition-colors"
                      >
                        <td className="py-2 pr-3 text-zinc-300 max-w-50">
                          <span className="truncate block">
                            {r.contestTitle}
                          </span>
                          <span className="text-zinc-600 text-[10px]">
                            {fmtDate(r.createdAt)}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right text-zinc-400 tabular-nums">
                          #{r.rank}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums font-bold text-zinc-200">
                          {r.ratingAfter}
                        </td>
                        <td
                          className={`py-2 text-right tabular-nums font-bold ${
                            r.delta >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {r.delta >= 0 ? "+" : ""}
                          {r.delta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
