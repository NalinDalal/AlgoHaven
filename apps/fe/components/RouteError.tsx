"use client";

import { useEffect } from "react";

interface RouteErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export function RouteError({ error, reset }: RouteErrorProps) {
    useEffect(() => {
        console.error("[RouteError]", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center flex-col gap-6 font-mono">
            {/* Error Box */}
            <div className="bg-red-950 border border-red-900 text-red-400 px-8 py-5 rounded-lg max-w-md text-center text-sm">
                Something went wrong.
            </div>

            {/* Error Digest */}
            {error.digest && (
                <div className="text-xs text-zinc-500 tracking-widest">
                    Error ID: {error.digest}
                </div>
            )}

            {/* Retry Button */}
            <button
                onClick={reset}
                className="border border-zinc-700 hover:border-zinc-500 text-emerald-400 hover:text-emerald-300 px-8 py-2.5 rounded-md transition-colors text-sm font-medium"
            >
                Try again
            </button>
        </div>
    );
}
