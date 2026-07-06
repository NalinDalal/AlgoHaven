'use client';
type Pip = "ac" | "wa" | "un";

interface Player {
  rank: number;
  rankStyle?: "gold" | "silver" | "bronze";
  handle: string;
  handleStyle?: "master" | "expert" | "candidate" | "ghost";
  score: string;
  penalty: string;
  pips: Pip[];
}

const players: Player[] = [
  {
    rank: 1,
    rankStyle: "gold",
    handle: "tourist",
    handleStyle: "master",
    score: "3150",
    penalty: "+0:14",
    pips: ["ac", "ac", "ac", "ac", "ac"],
  },
  {
    rank: 2,
    rankStyle: "silver",
    handle: "jiangly",
    handleStyle: "master",
    score: "3150",
    penalty: "+0:31",
    pips: ["ac", "ac", "ac", "ac", "ac"],
  },
  {
    rank: 3,
    rankStyle: "bronze",
    handle: "ecnerwala",
    handleStyle: "expert",
    score: "2700",
    penalty: "+0:48",
    pips: ["ac", "ac", "ac", "ac", "un"],
  },
  {
    rank: 4,
    rankStyle: undefined,
    handle: "neal",
    handleStyle: "candidate",
    score: "2200",
    penalty: "+1:02",
    pips: ["ac", "ac", "ac", "wa", "un"],
  },
  {
    rank: 5,
    rankStyle: undefined,
    handle: "you?",
    handleStyle: "ghost",
    score: "—",
    penalty: "—",
    pips: ["un", "un", "un", "un", "un"],
  },
];

const rankColors: Record<string, string> = {
  gold: "#ffd700",
  silver: "#c0c0c0",
  bronze: "#cd7f32",
};

const handleColors: Record<string, string> = {
  master: "#ef4444",
  expert: "#a855f7",
  candidate: "var(--blue)",
  ghost: "#555",
};

const pipColors: Record<Pip, string> = {
  ac: "var(--code-green)",
  wa: "var(--red)",
  un: "#2a2a2a",
};

export default function Leaderboard() {
  return (
    <section className="mx-auto py-16 px-8 pb-24 max-w-[1100px]">
      <div className="font-mono text-[12px] text-[var(--accent)] tracking-[.12em] uppercase mb-4">
        // Live right now
      </div>

      <h2 className="font-[family-name:var(--font-syne)] font-extrabold text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-.02em] mb-6">
        AlgoHaven Round #41
      </h2>

      <div className="bg-[var(--surface)] border border-[var(--border-lit)] rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#0d0d0d] border-b border-[var(--border)] py-3.5 px-6">
          <span className="font-mono text-[13px] font-bold text-[var(--text)]">
            Standings — 1:14:22 remaining
          </span>
          <span className="flex items-center gap-2 font-mono text-[11px] text-[var(--code-green)]">
            <span className="animate-pulse-dot inline-block w-[7px] h-[7px] rounded-full bg-[var(--code-green)]" />
            LIVE
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["#", "Handle", "Score", "Penalty", "A B C D E"].map((h) => (
                  <th
                    key={h}
                    className="font-mono text-[11px] text-[var(--muted)] text-left py-2.5 px-6 border-b border-[var(--border)] tracking-[.06em] uppercase font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr
                  key={p.rank}
                  className="transition-[background] duration-150 hover:bg-[#161616]"
                >
                  {/* Rank */}
                  <td
                    className="font-mono text-[13px] py-3.5 px-6 border-b border-[var(--border)] font-bold"
                    style={{
                      color: p.rankStyle
                        ? rankColors[p.rankStyle]
                        : "var(--muted)",
                    }}
                  >
                    {p.rank}
                  </td>

                  {/* Handle */}
                  <td
                    className="font-mono text-[13px] py-3.5 px-6 border-b border-[var(--border)] font-semibold"
                    style={{
                      color: p.handleStyle
                        ? handleColors[p.handleStyle]
                        : "var(--text)",
                    }}
                  >
                    {p.handle}
                  </td>

                  {/* Score */}
                  <td
                    className="font-mono text-[13px] py-3.5 px-6 border-b border-[var(--border)] font-bold"
                    style={{
                      color:
                        p.handleStyle === "ghost"
                          ? "#333"
                          : "var(--accent)",
                    }}
                  >
                    {p.score}
                  </td>

                  {/* Penalty */}
                  <td className="font-mono text-[12px] py-3.5 px-6 border-b border-[var(--border)] text-[var(--muted)]">
                    {p.penalty}
                  </td>

                  {/* Pips */}
                  <td className="py-3.5 px-6 border-b border-[var(--border)]">
                    <div className="flex items-center gap-1">
                      {p.pips.map((pip, i) => (
                        <span
                          key={i}
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: pipColors[pip] }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
