export function getRankTier(rating: number | null): {
  tier: string;
  color: string;
  bg: string;
} {
  if (rating === null)
    return { tier: "Unrated", color: "#888888", bg: "#88888815" };
  if (rating < 1200)
    return { tier: "Newbie", color: "#808080", bg: "#80808015" };
  if (rating < 1400)
    return { tier: "Pupil", color: "#008000", bg: "#00800015" };
  if (rating < 1600)
    return { tier: "Specialist", color: "#03a89e", bg: "#03a89e15" };
  if (rating < 1900)
    return { tier: "Expert", color: "#0000ff", bg: "#0000ff15" };
  if (rating < 2100)
    return { tier: "Candidate Master", color: "#aa00aa", bg: "#aa00aa15" };
  if (rating < 2300)
    return { tier: "Master", color: "#ff8c00", bg: "#ff8c0015" };
  if (rating < 2400)
    return { tier: "International Master", color: "#ff8c00", bg: "#ff8c0015" };
  if (rating < 2600)
    return { tier: "Grandmaster", color: "#ff0000", bg: "#ff000015" };
  if (rating < 3000)
    return {
      tier: "International Grandmaster",
      color: "#ff0000",
      bg: "#ff000015",
    };
  return { tier: "Legendary Grandmaster", color: "#ff0000", bg: "#ff000015" };
}

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  condition: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  totalSubmissions: number;
  acceptedCount: number;
  solvedCount: number;
  difficultyBreakdown?: { EASY: number; MEDIUM: number; HARD: number };
  streak?: { current: number; longest: number };
  contestsEntered: number;
  ratingDelta: number;
}

export const BADGES: Badge[] = [
  {
    id: "first_submission",
    name: "First Steps",
    desc: "Submit your first solution",
    icon: "🚀",
    condition: (s) => s.totalSubmissions >= 1,
  },
  {
    id: "ten_submissions",
    name: "Getting Started",
    desc: "Submit 10 solutions",
    icon: "📝",
    condition: (s) => s.totalSubmissions >= 10,
  },
  {
    id: "hundred_submissions",
    name: "Dedicated",
    desc: "Submit 100 solutions",
    icon: "💯",
    condition: (s) => s.totalSubmissions >= 100,
  },
  {
    id: "first_accepted",
    name: "Hello World",
    desc: "Get your first accepted",
    icon: "✅",
    condition: (s) => s.acceptedCount >= 1,
  },
  {
    id: "ten_solved",
    name: "Problem Solver",
    desc: "Solve 10 problems",
    icon: "🧩",
    condition: (s) => s.solvedCount >= 10,
  },
  {
    id: "fifty_solved",
    name: "Prolific",
    desc: "Solve 50 problems",
    icon: "🏆",
    condition: (s) => s.solvedCount >= 50,
  },
  {
    id: "easy_master",
    name: "Warming Up",
    desc: "Solve 20 easy problems",
    icon: "🌱",
    condition: (s) => (s.difficultyBreakdown?.EASY ?? 0) >= 20,
  },
  {
    id: "medium_master",
    name: "Intermediate",
    desc: "Solve 20 medium problems",
    icon: "📈",
    condition: (s) => (s.difficultyBreakdown?.MEDIUM ?? 0) >= 20,
  },
  {
    id: "hard_master",
    name: "Elite",
    desc: "Solve 20 hard problems",
    icon: "🔥",
    condition: (s) => (s.difficultyBreakdown?.HARD ?? 0) >= 20,
  },
  {
    id: "streak_7",
    name: "Consistent",
    desc: "7 day submission streak",
    icon: "🔥",
    condition: (s) => (s.streak?.current ?? 0) >= 7,
  },
  {
    id: "streak_30",
    name: "Dedicated",
    desc: "30 day submission streak",
    icon: "⚡",
    condition: (s) => (s.streak?.current ?? 0) >= 30,
  },
  {
    id: "contestParticipant",
    name: "Competitor",
    desc: "Enter a contest",
    icon: "🏁",
    condition: (s) => s.contestsEntered >= 1,
  },
  {
    id: "rated_climb",
    name: "Rising Star",
    desc: "Improve rating in a contest",
    icon: "📊",
    condition: (s) => s.ratingDelta > 0,
  },
];
