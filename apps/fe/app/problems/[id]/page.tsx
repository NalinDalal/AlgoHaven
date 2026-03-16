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

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`)
      .then((r) => r.json())
      .then((d) => { setProblem(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (!problem) return <NotFound />;

  return <ProblemWrapper problem={problem} />;
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <>
      <Nav />
      <div className="min-h-screen bg-[#0a0a0a] pt-20 flex items-center justify-center">
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
      <div className="min-h-screen bg-[#0a0a0a] pt-20 flex flex-col items-center justify-center font-mono gap-3">
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