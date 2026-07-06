'use client';
const features = [
  {
    tag: "JUDGE",
    title: "Docker Sandbox",
    desc: "Every submission runs in an isolated container. No network, no root, seccomp-hardened. 12ms median turnaround.",
  },
  {
    tag: "LEADERBOARD",
    title: "Real-time Rankings",
    desc: "WebSocket-powered live leaderboard backed by Redis ZSET. Codeforces-style freeze in the final 30 minutes.",
  },
  {
    tag: "EDITOR",
    title: "Monaco Editor",
    desc: "VS Code's editor in your browser. Syntax highlighting for C++, Python, Java, JavaScript with per-language time limits.",
  },
  {
    tag: "ANALYTICS",
    title: "Deep Analytics",
    desc: "Submission heatmaps, topic breakdown, percentile ranking, average solve time. Know your weak spots.",
  },
  {
    tag: "RATING",
    title: "Elo Rating System",
    desc: "Codeforces-style rating deltas after every contest. Virtual contests let you replay any past round solo.",
  },
  {
    tag: "PLAGIARISM",
    title: "Plagiarism Detection",
    desc: "Token-similarity analysis across all contest submissions. Flagged pairs go to admin review before any action.",
  },
];

export default function Features() {
  return (
    <section className="mx-auto py-24 px-8 max-w-[1100px]">
      <div className="font-mono text-[12px] text-[var(--accent)] tracking-[.12em] uppercase mb-4">
        // What you get
      </div>

      <h2 className="font-[family-name:var(--font-syne)] font-extrabold text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-.02em] mb-14">
        Everything a contest
        <br />
        platform should have.
      </h2>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-px border border-[var(--border)] rounded overflow-hidden">
        {features.map((f) => (
          <FeatureCard key={f.tag} {...f} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  tag,
  title,
  desc,
}: {
  tag: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-[var(--surface)] p-8 border-r border-b border-[var(--border)] transition-[background] duration-200 cursor-default hover:bg-[#161616]">
      {/* Tag */}
      <div className="font-mono text-[11px] font-bold text-[var(--accent)] tracking-[.08em] mb-4 flex items-center gap-1.5">
        <span className="text-[#333]">//</span>
        {tag}
      </div>

      <div className="font-bold text-[17px] mb-2 text-[var(--text)]">
        {title}
      </div>

      <div className="font-mono text-[13px] text-[var(--muted)] leading-[1.7]">
        {desc}
      </div>
    </div>
  );
}
