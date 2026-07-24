'use client';

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

interface Verdict {
    status: string;
    username: string;
    problemSlug: string;
    language: string;
    executionTimeMs: number | null;
}

const statusClass: Record<string, string> = {
    ACCEPTED: "v-ac",
    WRONG_ANSWER: "v-wa",
    TLE: "v-tle",
    MLE: "v-mle",
    RUNTIME_ERROR: "v-re",
    COMPILE_ERROR: "v-re",
};

export default function VerdictTicker() {
    const [verdicts, setVerdicts] = useState<Verdict[]>([]);

    useEffect(() => {
        apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/contest?limit=1`, {
            credentials: "include",
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.status === "success" && d.data?.contests?.[0]?.id) {
                    return apiFetch(
                        `${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${d.data.contests[0].id}/submissions?limit=8`,
                        { credentials: "include" },
                    );
                }
                return null;
            })
            .then((r) => r?.json())
            .then((d) => {
                if (d?.status === "success" && d.data?.submissions) {
                    setVerdicts(
                        d.data.submissions.map((s: Record<string, unknown>) => ({
                            status: s.status as string,
                            username: (s.user as Record<string, unknown>)?.username as string || "Anonymous",
                            problemSlug: (s.problem as Record<string, unknown>)?.slug as string || "?",
                            language: s.language as string,
                            executionTimeMs: s.executionTimeMs as number | null,
                        })),
                    );
                }
            })
            .catch(() => {});
    }, []);

    if (verdicts.length === 0) return null;

    const allVerdicts = [...verdicts, ...verdicts];

    return (
        <div className="w-full overflow-hidden border-y border-zinc-800 bg-zinc-950 py-2.5">
            <div className="flex gap-10 whitespace-nowrap animate-scroll-left">
                {allVerdicts.map((v, i) => (
                    <span key={i} className={`v-chip ${statusClass[v.status] ?? "v-wa"}`}>
                        {v.status === "ACCEPTED" ? "AC" : v.status.replace("_", " ").slice(0, 3)} · {v.username} · {v.problemSlug}
                    </span>
                ))}
            </div>
        </div>
    );
}
