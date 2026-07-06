/* ─── Difficulty badge ─── */

export type DifficultyLevel = "easy" | "medium" | "hard" | "extreme";

const difficultyClasses: Record<DifficultyLevel, string> = {
  easy: "bg-[#0d2e16] text-[var(--code-green)] border border-[#1a5c2d]",
  medium: "bg-[#1a1a0d] text-[#ffd700] border border-[#4a4a1a]",
  hard: "bg-[#2d0d0d] text-[var(--red)] border border-[#5c1a1a]",
  extreme: "bg-[#2d1a0d] text-[#ff9500] border border-[#6e3a1a]",
};

const badgeBase = "inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 rounded-sm shrink-0 whitespace-nowrap";

export function getDifficultyLevel(rating: number): DifficultyLevel {
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
    <span className={`${badgeBase} ${difficultyClasses[level]}`}>
      {label} ({rating})
    </span>
  );
}

/* ─── Verdict badge ─── */

export type VerdictType = "AC" | "WA" | "TLE" | "MLE" | "RE" | string;

const verdictClasses: Record<string, string> = {
  AC: "bg-[#0d2e16] text-[var(--code-green)] border border-[#1a5c2d]",
  WA: "bg-[#2d0d0d] text-[var(--red)] border border-[#5c1a1a]",
  TLE: "bg-[#1a1a0d] text-[#ffd700] border border-[#4a4a1a]",
  MLE: "bg-[#0d1a2d] text-[var(--blue)] border border-[#1a3a6e]",
  RE: "bg-[#2d1a0d] text-[#ff9500] border border-[#6e3a1a]",
};

export function VerdictBadge({ verdict }: { verdict: string }) {
  return (
    <span className={`${badgeBase} ${verdictClasses[verdict] ?? "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"}`}>
      {verdict}
    </span>
  );
}
