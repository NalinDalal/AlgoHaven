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
    gold: "text-[#ffd700]",
    silver: "text-[#c0c0c0]",
    bronze: "text-[#cd7f32]",
};

const handleColors: Record<string, string> = {
    master: "text-red-500",
    expert: "text-purple-500",
    candidate: "text-blue-400",
    ghost: "text-zinc-600",
};

const pipColors: Record<Pip, string> = {
    ac: "bg-emerald-500",
    wa: "bg-red-500",
    un: "bg-zinc-800",
};

export default function Leaderboard() {
    return (
        <section className="mx-auto py-16 px-8 pb-24 max-w-[1100px]">
            <div className="font-mono text-xs text-emerald-400 tracking-[0.12em] uppercase mb-4">
        // Live right now
            </div>

            <h2 className="font-bold text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] mb-6 text-zinc-100">
                AlgoHaven Round #41
            </h2>

            <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between bg-zinc-950 border-b border-zinc-800 py-3.5 px-6">
                    <span className="font-mono text-[13px] font-bold text-zinc-100">
                        Standings — 1:14:22 remaining
                    </span>
                    <span className="flex items-center gap-2 font-mono text-xs text-emerald-400">
                        <span className="animate-pulse inline-block w-[7px] h-[7px] rounded-full bg-emerald-400" />
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
                                        className="font-mono text-[11px] text-zinc-500 text-left py-3 px-6 border-b border-zinc-800 tracking-widest uppercase font-medium"
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
                                    className="hover:bg-zinc-800/70 transition-colors duration-150"
                                >
                                    {/* Rank */}
                                    <td
                                        className={`font-mono text-[13px] py-4 px-6 border-b border-zinc-800 font-bold ${p.rankStyle ? rankColors[p.rankStyle] : "text-zinc-400"
                                            }`}
                                    >
                                        {p.rank}
                                    </td>

                                    {/* Handle */}
                                    <td
                                        className={`font-mono text-[13px] py-4 px-6 border-b border-zinc-800 font-semibold ${p.handleStyle ? handleColors[p.handleStyle] : "text-zinc-200"
                                            }`}
                                    >
                                        {p.handle}
                                    </td>

                                    {/* Score */}
                                    <td
                                        className={`font-mono text-[13px] py-4 px-6 border-b border-zinc-800 font-bold ${p.handleStyle === "ghost" ? "text-zinc-700" : "text-emerald-400"
                                            }`}
                                    >
                                        {p.score}
                                    </td>

                                    {/* Penalty */}
                                    <td className="font-mono text-sm py-4 px-6 border-b border-zinc-800 text-zinc-400">
                                        {p.penalty}
                                    </td>

                                    {/* Pips */}
                                    <td className="py-4 px-6 border-b border-zinc-800">
                                        <div className="flex items-center gap-1.5">
                                            {p.pips.map((pip, i) => (
                                                <span
                                                    key={i}
                                                    className={`inline-block w-2.5 h-2.5 rounded-full ${pipColors[pip]}`}
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
