'use client';

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

interface LeaderboardEntry {
    rank: number;
    username: string;
    totalPoints: number;
    solved: number;
    penaltyMins: number;
}

export default function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Try to fetch the most recent contest's leaderboard
        apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/contest?limit=1`, {
            credentials: "include",
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.status === "success" && d.data?.contests?.[0]?.id) {
                    return apiFetch(
                        `${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${d.data.contests[0].id}/leaderboard`,
                        { credentials: "include" },
                    );
                }
                return null;
            })
            .then((r) => r?.json())
            .then((d) => {
                if (d?.status === "success" && d.data?.entries) {
                    setEntries(d.data.entries.slice(0, 5));
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="mx-auto py-16 px-8 pb-24 max-w-[1100px]">
            <div className="font-mono text-xs text-emerald-400 tracking-[0.12em] uppercase mb-4">
                // Recent Contest
            </div>

            <h2 className="font-bold text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] mb-6 text-zinc-100">
                Leaderboard
            </h2>

            {loading ? (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center">
                    <span className="font-mono text-sm text-zinc-500">Loading...</span>
                </div>
            ) : entries.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center">
                    <span className="font-mono text-sm text-zinc-500">
                        No contest data yet. Join a contest to see standings here.
                    </span>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                {["#", "Handle", "Score", "Solved", "Penalty"].map((h) => (
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
                            {entries.map((e) => (
                                <tr
                                    key={e.rank}
                                    className="hover:bg-zinc-800/70 transition-colors duration-150"
                                >
                                    <td className={`font-mono text-[13px] py-4 px-6 border-b border-zinc-800 font-bold ${
                                        e.rank === 1 ? "text-[#ffd700]" : e.rank === 2 ? "text-[#c0c0c0]" : e.rank === 3 ? "text-[#cd7f32]" : "text-zinc-400"
                                    }`}>
                                        {e.rank}
                                    </td>
                                    <td className="font-mono text-[13px] py-4 px-6 border-b border-zinc-800 font-semibold text-zinc-200">
                                        {e.username || "Anonymous"}
                                    </td>
                                    <td className="font-mono text-[13px] py-4 px-6 border-b border-zinc-800 font-bold text-emerald-400">
                                        {e.totalPoints}
                                    </td>
                                    <td className="font-mono text-sm py-4 px-6 border-b border-zinc-800 text-zinc-400">
                                        {e.solved}
                                    </td>
                                    <td className="font-mono text-sm py-4 px-6 border-b border-zinc-800 text-zinc-400">
                                        {e.penaltyMins > 0 ? `+${e.penaltyMins}` : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
