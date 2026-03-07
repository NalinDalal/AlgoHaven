'use client';
import { useState } from "react";
import Link from "next/link";
import { MagicLinkForm } from "./components/MagicLinkForm";

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("sent");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setStatus("error");
      }
    } catch (err) {
      setError("Network error");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <div className="text-lg font-semibold tracking-tight">AlgoHaven</div>
        <a
          href="#get-started"
          className="rounded-full border border-foreground/20 px-4 py-2 text-sm transition hover:bg-foreground hover:text-background"
        >
          Get Started
        </a>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:px-10 md:py-24">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-foreground/20 px-3 py-1 text-sm">
              Competitive coding, reimagined
            </p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Practice. Compete. Improve every day.
            </h1>
            <p className="max-w-xl text-foreground/70">
              AlgoHaven helps developers train with structured challenges, real-time contests, and actionable performance insights.
            </p>
            <div id="get-started" className="flex flex-wrap gap-3">
              <div className="w-full max-w-xs">
                <MagicLinkForm />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 md:p-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-foreground/10 bg-background p-4">
                <p className="text-sm text-foreground/60">Problems Solved</p>
                <p className="mt-1 text-2xl font-semibold">1,240+</p>
              </div>
              <div className="rounded-xl border border-foreground/10 bg-background p-4">
                <p className="text-sm text-foreground/60">Live Contests</p>
                <p className="mt-1 text-2xl font-semibold">48</p>
              </div>
              <div className="rounded-xl border border-foreground/10 bg-background p-4">
                <p className="text-sm text-foreground/60">Avg. Rank Gain</p>
                <p className="mt-1 text-2xl font-semibold">+17%</p>
              </div>
              <div className="rounded-xl border border-foreground/10 bg-background p-4">
                <p className="text-sm text-foreground/60">Success Rate</p>
                <p className="mt-1 text-2xl font-semibold">86%</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-20 md:px-10">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight md:text-3xl">Why AlgoHaven</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-foreground/10 p-6">
              <h3 className="text-lg font-semibold">Structured Roadmaps</h3>
              <p className="mt-2 text-sm text-foreground/70">Follow a guided path from basics to advanced patterns without getting stuck.</p>
            </article>
            <article className="rounded-2xl border border-foreground/10 p-6">
              <h3 className="text-lg font-semibold">Live Competition</h3>
              <p className="mt-2 text-sm text-foreground/70">Join contests with live leaderboards and challenge yourself under pressure.</p>
            </article>
            <article className="rounded-2xl border border-foreground/10 p-6">
              <h3 className="text-lg font-semibold">Progress Analytics</h3>
              <p className="mt-2 text-sm text-foreground/70">Track strengths, weak areas, and improvement trends over time.</p>
            </article>
          </div>
        </section>
      </main>
      <footer className="border-t border-foreground/10 py-6 text-center text-sm text-foreground/60">
        Built for serious problem solvers.
      </footer>
    </div>
  );
}
