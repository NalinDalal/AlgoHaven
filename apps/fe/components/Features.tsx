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
    <section
      className="mx-auto"
      style={{ padding: "6rem 2rem", maxWidth: 1100 }}
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
        // What you get
      </div>

      <h2
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(2rem, 4vw, 3rem)",
          lineHeight: 1.05,
          letterSpacing: "-.02em",
          marginBottom: "3.5rem",
        }}
      >
        Everything a contest
        <br />
        platform should have.
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1px",
          border: "1px solid var(--border)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
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
    <div
      style={{
        background: "var(--surface)",
        padding: "2rem",
        borderRight: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        transition: "background .2s",
        cursor: "default",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "#161616")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--surface)")
      }
    >
      {/* Tag */}
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--accent)",
          letterSpacing: ".08em",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ color: "#333" }}>//</span>
        {tag}
      </div>

      <div
        style={{
          fontWeight: 700,
          fontSize: 17,
          marginBottom: ".5rem",
          color: "var(--text)",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 13,
          color: "var(--muted)",
          lineHeight: 1.7,
        }}
      >
        {desc}
      </div>
    </div>
  );
}