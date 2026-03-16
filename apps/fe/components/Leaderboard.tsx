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
    <section
      className="mx-auto"
      style={{ padding: "4rem 2rem 6rem", maxWidth: 1100 }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "var(--accent)",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          marginBottom: "1rem",
        }}
      >
        // Live right now
      </div>

      <h2
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(2rem, 4vw, 3rem)",
          lineHeight: 1.05,
          letterSpacing: "-.02em",
          marginBottom: "1.5rem",
        }}
      >
        AlgoHaven Round #41
      </h2>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-lit)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            background: "#0d0d0d",
            borderBottom: "1px solid var(--border)",
            padding: "14px 24px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            Standings — 1:14:22 remaining
          </span>
          <span
            className="flex items-center gap-2"
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              color: "var(--code-green)",
            }}
          >
            <span
              className="animate-pulse-dot"
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--code-green)",
              }}
            />
            LIVE
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["#", "Handle", "Score", "Penalty", "A B C D E"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 11,
                      color: "var(--muted)",
                      textAlign: "left",
                      padding: "10px 24px",
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
              {players.map((p) => (
                <tr
                  key={p.rank}
                  style={{ transition: "background .15s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#161616")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Rank */}
                  <td
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 13,
                      padding: "14px 24px",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 700,
                      color: p.rankStyle
                        ? rankColors[p.rankStyle]
                        : "var(--muted)",
                    }}
                  >
                    {p.rank}
                  </td>

                  {/* Handle */}
                  <td
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 13,
                      padding: "14px 24px",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 600,
                      color: p.handleStyle
                        ? handleColors[p.handleStyle]
                        : "var(--text)",
                    }}
                  >
                    {p.handle}
                  </td>

                  {/* Score */}
                  <td
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 13,
                      padding: "14px 24px",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 700,
                      color:
                        p.handleStyle === "ghost"
                          ? "#333"
                          : "var(--accent)",
                    }}
                  >
                    {p.score}
                  </td>

                  {/* Penalty */}
                  <td
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 12,
                      padding: "14px 24px",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--muted)",
                    }}
                  >
                    {p.penalty}
                  </td>

                  {/* Pips */}
                  <td
                    style={{
                      padding: "14px 24px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {p.pips.map((pip, i) => (
                        <span
                          key={i}
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: pipColors[pip],
                          }}
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