"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import ProblemWrapper, { type ProblemData } from "@/components/problemWrapper";

export default function ProblemDetailPage() {
  const { id } = useParams() as { id: string };
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [loading, setLoading] = useState(true);

  // #1: Error handling — store error message to show user
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // #3: Guard — don't fetch if id is empty/undefined (e.g. during hydration)
    if (!id) return;

    // #2: Race condition — abort request if user navigates away before fetch completes
    const controller = new AbortController();

    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`, {
      signal: controller.signal,
    })
      .then((r) => {
        // #1: Check HTTP status — throw specific error based on status code
        if (!r.ok) {
          if (r.status === 404) throw new Error("not_found");
          throw new Error("server_error");
        }
        return r.json();
      })
      .then((d: { data: ProblemData }) => {
        // #4: Type safety — explicitly type the response
        setProblem(d.data);
      })
      .catch((e) => {
        // #2: Ignore AbortError — it's expected when user navigates away
        if (e.name !== "AbortError") {
          // #1: Store error message for display
          setError(e.message);
        }
      })
      .finally(() => setLoading(false));

    // #2: Cleanup — cancel request on unmount or when id changes
    return () => controller.abort();
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  // #1: Show error state if fetch failed
  if (error) return <ErrorState error={error} />;

  // #1: Show 404 if problem is null (could be not_found or empty response)
  if (!problem) return <NotFound />;

  return <ProblemWrapper problem={problem} />;
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <>
      <Nav />
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="font-mono text-[13px] text-zinc-600 flex items-center gap-2.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[#e8ff47] animate-pulse" />
          Fetching problem...
        </span>
      </div>
    </>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <>
      <Nav />
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-mono gap-3">
        <div className="text-[13px] text-red-400 border border-red-900 bg-red-950 px-6 py-2.5 rounded-sm">
          404 · Problem not found
        </div>
        <Link
          href="/problems"
          className="text-xs text-zinc-600 hover:text-[#e8ff47] transition-colors no-underline"
        >
          ← Back to problems
        </Link>
      </div>
    </>
  );
}

// ─── Error State ────────────────────────────────────────────────────────────────
function ErrorState({ error }: { error: string }) {
  const isNotFound = error === "not_found";

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-mono gap-3">
        <div className="text-[13px] border px-6 py-2.5 rounded-sm bg-red-950 border-red-900 text-red-400">
          {isNotFound ? "404 · Problem not found" : "Error loading problem"}
        </div>
        {!isNotFound && (
          <div className="text-[11px] text-zinc-600">
            Something went wrong. Please try again.
          </div>
        )}
        <Link
          href="/problems"
          className="text-xs text-zinc-600 hover:text-[#e8ff47] transition-colors no-underline"
        >
          ← Back to problems
        </Link>
      </div>
    </>
  );
}
