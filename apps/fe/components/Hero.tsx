'use client';
import Link from "next/link";

const stats = [
    { num: "2,400+", label: "Problems" },
    { num: "38k", label: "Submissions Today" },
    { num: "12ms", label: "Avg Judge Latency" },
    { num: "6", label: "Live Contests" },
];

const codeLines = [
    [
        { t: "kw", v: "int" },
        { t: "sp", v: " " },
        { t: "fn", v: "solve" },
        { t: "sp", v: "(" },
        { t: "kw", v: "vector" },
        { t: "sp", v: "<" },
        { t: "kw", v: "int" },
        { t: "sp", v: ">&& a) {" },
    ],
    [
        { t: "sp", v: "  " },
        { t: "kw", v: "int" },
        { t: "sp", v: " " },
        { t: "var", v: "n" },
        { t: "sp", v: " = a." },
        { t: "fn", v: "size" },
        { t: "sp", v: "(), " },
        { t: "var", v: "ans" },
        { t: "sp", v: " = " },
        { t: "num", v: "0" },
        { t: "sp", v: ";" },
    ],
    [{ t: "sp", v: "  " }, { t: "kw", v: "map" }, { t: "sp", v: "<" }, { t: "kw", v: "int" }, { t: "sp", v: "," }, { t: "kw", v: "int" }, { t: "sp", v: "> " }, { t: "var", v: "freq" }, { t: "sp", v: ";" }],
    [{ t: "sp", v: "  " }, { t: "kw", v: "for" }, { t: "sp", v: " (" }, { t: "kw", v: "int" }, { t: "sp", v: " " }, { t: "var", v: "x" }, { t: "sp", v: " : a) " }, { t: "var", v: "freq" }, { t: "sp", v: "[" }, { t: "var", v: "x" }, { t: "sp", v: "]++;" }],
    [{ t: "cm", v: "  // greedy: pick largest non-conflicting" }],
    [{ t: "sp", v: "  " }, { t: "kw", v: "for" }, { t: "sp", v: " (" }, { t: "kw", v: "auto" }, { t: "sp", v: "& [" }, { t: "var", v: "v" }, { t: "sp", v: ", " }, { t: "var", v: "c" }, { t: "sp", v: "] : " }, { t: "var", v: "freq" }, { t: "sp", v: ")" }],
    [{ t: "sp", v: "    " }, { t: "var", v: "ans" }, { t: "sp", v: " = " }, { t: "fn", v: "max" }, { t: "sp", v: "(" }, { t: "var", v: "ans" }, { t: "sp", v: ", " }, { t: "var", v: "v" }, { t: "sp", v: " * " }, { t: "var", v: "c" }, { t: "sp", v: ");" }],
    [{ t: "sp", v: "  " }, { t: "kw", v: "return" }, { t: "sp", v: " " }, { t: "var", v: "ans" }, { t: "sp", v: ";" }],
    [{ t: "sp", v: "}" }],
];

const tokenColors: Record<string, string> = {
    kw: "text-violet-400",
    fn: "text-sky-400",
    str: "text-emerald-400",
    cm: "text-zinc-700",
    num: "text-orange-400",
    var: "text-zinc-200",
    sp: "text-zinc-200",
};

export default function Hero() {
    return (
        <section className="min-h-screen flex flex-col items-center justify-center text-center relative overflow-hidden px-8 pt-20 pb-16 bg-zinc-950">
            {/* Background Grid (optional) */}
            <div className="grid-bg absolute inset-0 opacity-30" />

            {/* Eyebrow */}
            <div className="animate-fade-up inline-block mb-8 font-mono text-xs font-medium text-emerald-400 tracking-[0.12em] uppercase border border-emerald-400/70 py-1.5 px-5 rounded">
                Competitive Programming Platform
            </div>

            {/* Title */}
            <h1 className="animate-fade-up-1 font-bold text-[clamp(3rem,8vw,7rem)] leading-[0.95] tracking-[-0.03em] text-zinc-100">
                <span className="text-zinc-700">Compete.</span>
                <br />
                <span className="text-zinc-100">Solve.</span>
                <br />
                <span className="text-emerald-400">
                    Dominate
                    <span className="animate-blink text-emerald-400">_</span>
                </span>
            </h1>

            {/* Subtext */}
            <p className="animate-fade-up-2 mt-8 font-mono text-sm leading-relaxed text-zinc-400 max-w-[520px]">
                Sharpen your algorithms on real contest problems.
                <br />
                <span className="text-zinc-200 font-normal">
                    Real-time leaderboards. Docker-sandboxed judging.
                </span>
                <br />
                Built for serious programmers and first-timers alike.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-up-3 flex flex-col sm:flex-row gap-4 mt-10">
                <Link
                    href="/register"
                    className="bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-black font-mono text-sm font-bold py-3.5 px-8 rounded transition-all hover:-translate-y-0.5"
                >
                    Start Competing →
                </Link>
                <Link
                    href="/problems"
                    className="bg-transparent border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 font-mono text-sm font-medium py-3.5 px-8 rounded transition-colors"
                >
                    Browse Problems
                </Link>
            </div>

            {/* Stats */}
            <div className="animate-fade-up-4 flex items-center mt-16 gap-12">
                {stats.map((s, i) => (
                    <div key={s.label} className="flex items-center gap-12">
                        <div className="text-center">
                            <div className="font-mono text-2xl font-bold text-zinc-100">
                                {s.num}
                            </div>
                            <div className="font-mono text-[11px] text-zinc-500 mt-1 tracking-widest">
                                {s.label}
                            </div>
                        </div>
                        {i < stats.length - 1 && (
                            <div className="w-px h-10 bg-zinc-800" />
                        )}
                    </div>
                ))}
            </div>

            {/* Code Window */}
            <div className="animate-fade-up-5 w-full mt-20 max-w-[680px] bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl">
                {/* Titlebar */}
                <div className="flex items-center gap-2 bg-zinc-950 border-b border-zinc-800 py-3 px-4">
                    <div className="flex gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <span className="inline-block w-3 h-3 rounded-full bg-[#febc2e]" />
                        <span className="inline-block w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="font-mono text-xs text-zinc-400 ml-3">
                        solution.cpp — Problem 1847C
                    </span>
                    <span className="ml-auto font-mono text-[11px] font-bold bg-emerald-500/10 text-emerald-400 px-3 py-0.5 rounded border border-emerald-500/20">
                        AC · 124ms
                    </span>
                </div>

                {/* Code body */}
                <div className="p-6 pb-8 text-left font-mono text-sm leading-[1.85] overflow-x-auto">
                    {codeLines.map((line, i) => (
                        <div key={i} className="flex gap-6">
                            <span className="text-zinc-700 min-w-[20px] text-right select-none shrink-0">
                                {i + 1}
                            </span>
                            <span>
                                {line.map((tok, j) => (
                                    <span key={j} className={tokenColors[tok.t] || "text-zinc-200"}>
                                        {tok.v}
                                    </span>
                                ))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
