const badgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "var(--font-mono), monospace",
  fontSize: 12,
  padding: "4px 12px",
  borderRadius: 2,
  flexShrink: 0,
  whiteSpace: "nowrap",
};

/* ─── Difficulty badge ─── */

export type DifficultyLevel = "easy" | "medium" | "hard" | "extreme";

const difficultyColors: Record<DifficultyLevel, React.CSSProperties> = {
  easy: { background: "#0d2e16", color: "var(--code-green)", border: "1px solid #1a5c2d" },
  medium: { background: "#1a1a0d", color: "#ffd700", border: "1px solid #4a4a1a" },
  hard: { background: "#2d0d0d", color: "var(--red)", border: "1px solid #5c1a1a" },
  extreme: { background: "#2d1a0d", color: "#ff9500", border: "1px solid #6e3a1a" },
};

export function getDifficultyLevel(
  rating: number
): DifficultyLevel {
  if (rating < 1200) return "easy";
  if (rating < 1600) return "medium";
  if (rating < 2100) return "hard";
  return "extreme";
}

export function getDifficultyLabel(rating: number): string {
  if (rating < 1200) return "Easy";
  if (rating < 1600) return "Medium";
  if (rating < 2100) return "Hard";
  return "Extreme";
}

export function DifficultyBadge({ rating }: { rating: number }) {
  const level = getDifficultyLevel(rating);
  const label = getDifficultyLabel(rating);
  return (
    <span style={{ ...badgeBase, ...difficultyColors[level] }}>
      {label} ({rating})
    </span>
  );
}

/* ─── Verdict badge ─── */

export type VerdictType = "AC" | "WA" | "TLE" | "MLE" | "RE" | string;

const verdictColors: Record<string, React.CSSProperties> = {
  AC: { background: "#0d2e16", color: "var(--code-green)", border: "1px solid #1a5c2d" },
  WA: { background: "#2d0d0d", color: "var(--red)", border: "1px solid #5c1a1a" },
  TLE: { background: "#1a1a0d", color: "#ffd700", border: "1px solid #4a4a1a" },
  MLE: { background: "#0d1a2d", color: "var(--blue)", border: "1px solid #1a3a6e" },
  RE: { background: "#2d1a0d", color: "#ff9500", border: "1px solid #6e3a1a" },
};

const defaultVerdict: React.CSSProperties = {
  background: "var(--surface)",
  color: "var(--muted)",
  border: "1px solid var(--border)",
};

export function VerdictBadge({ verdict }: { verdict: string }) {
  return (
    <span style={{ ...badgeBase, ...verdictColors[verdict] ?? defaultVerdict }}>
      {verdict}
    </span>
  );
}
