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
            <div className="font-mono text-xs text-emerald-400 tracking-[0.12em] uppercase mb-4">
        // What you get
            </div>

            <h2 className="font-bold text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] mb-14 text-zinc-100">
                Everything a contest
                <br />
                platform should have.
            </h2>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-px border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
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
        <div className="group bg-zinc-900 p-8 border-r border-b border-zinc-800 hover:bg-zinc-800/70 transition-colors duration-200">
            {/* Tag */}
            <div className="font-mono text-[11px] font-bold text-emerald-400 tracking-[0.08em] mb-4 flex items-center gap-1.5">
                <span className="text-zinc-700">//</span>
                {tag}
            </div>

            <div className="font-semibold text-[17px] mb-3 text-zinc-100">
                {title}
            </div>

            <div className="font-mono text-[13px] text-zinc-400 leading-relaxed">
                {desc}
            </div>
        </div>
    );
}
