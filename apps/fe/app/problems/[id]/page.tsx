"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import Nav from "@/components/Nav";
import ProblemWrapper, {
    type ProblemData,
} from "@/components/problemWrapper";
import { apiFetch } from "@/lib/apiFetch";

export default function ProblemDetailPage() {
    const { id } = useParams() as { id: string };

    const [problem, setProblem] = useState<ProblemData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const controller = new AbortController();

        apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`, {
            signal: controller.signal,
        })
            .then((r) => {
                if (!r.ok) {
                    if (r.status === 404) {
                        throw new Error("not_found");
                    }

                    throw new Error("server_error");
                }

                return r.json();
            })
            .then((d: { data: ProblemData }) => {
                setProblem(d.data);
            })
            .catch((e) => {
                if (e.name !== "AbortError") {
                    setError(e.message);
                }
            })
            .finally(() => {
                setLoading(false);
            });

        return () => controller.abort();
    }, [id]);

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return <ErrorState error={error} />;
    }

    if (!problem) {
        return <NotFound />;
    }

    return <ProblemWrapper problem={problem} />;
}

function LoadingSkeleton() {
    return (
        <>
            <Nav />

            <div className="flex min-h-screen items-center justify-center bg-black">
                <span className="flex items-center gap-2 font-mono text-sm text-zinc-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-300" />
                    Fetching problem...
                </span>
            </div>
        </>
    );
}

function NotFound() {
    return (
        <>
            <Nav />

            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black font-mono">
                <div className="rounded border border-red-900 bg-red-950 px-6 py-2 text-sm text-red-400">
                    404 · Problem not found
                </div>

                <Link
                    href="/problems"
                    className="text-xs text-zinc-500 transition-colors hover:text-yellow-300"
                >
                    ← Back to problems
                </Link>
            </div>
        </>
    );
}

function ErrorState({ error }: { error: string }) {
    const isNotFound = error === "not_found";

    return (
        <>
            <Nav />

            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black font-mono">
                <div className="rounded border border-red-900 bg-red-950 px-6 py-2 text-sm text-red-400">
                    {isNotFound
                        ? "404 · Problem not found"
                        : "Error loading problem"}
                </div>

                {!isNotFound && (
                    <p className="text-xs text-zinc-500">
                        Something went wrong. Please try again.
                    </p>
                )}

                <Link
                    href="/problems"
                    className="text-xs text-zinc-500 transition-colors hover:text-yellow-300"
                >
                    ← Back to problems
                </Link>
            </div>
        </>
    );
}
