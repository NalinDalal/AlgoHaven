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
  kw: "text-[#c792ea]",
  fn: "text-[#82aaff]",
  str: "text-[#c3e88d]",
  cm: "text-[#444]",
  num: "text-[#f78c6c]",
  var: "text-[var(--text)]",
  sp: "text-[var(--text)]",
};

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center relative overflow-hidden px-8 pt-20 pb-16">
      <div className="grid-bg" />

      {/* Eyebrow */}
      <div className="animate-fade-up inline-block mb-8 font-mono text-[12px] font-medium text-[var(--accent)] tracking-[.12em] uppercase border border-[var(--accent)] py-[5px] px-[14px] rounded-[2px]">
        Competitive Programming Platform
      </div>

      {/* Title */}
      <h1 className="animate-fade-up-1 font-[family-name:var(--font-syne)] font-extrabold text-[clamp(3rem,8vw,7rem)] leading-[0.95] tracking-[-.03em]">
        <span className="text-[#333]">Compete.</span>
        <br />
        <span className="text-[var(--text)]">Solve.</span>
        <br />
        <span className="text-[var(--accent)]">
          Dominate
          <span className="animate-blink text-[var(--accent)]">_</span>
        </span>
      </h1>

      {/* Subtext */}
      <p className="animate-fade-up-2 mt-7 font-mono text-[14px] leading-[1.8] text-[var(--muted)] max-w-[520px]">
        Sharpen your algorithms on real contest problems.
        <br />
        <span className="text-[var(--text)] font-normal">
          Real-time leaderboards. Docker-sandboxed judging.
        </span>
        <br />
        Built for serious programmers and first-timers alike.
      </p>

      {/* CTA Buttons */}
      <div className="animate-fade-up-3 flex flex-col sm:flex-row gap-4 mt-10 items-center">
        <Link
          href="/register"
          className="bg-[var(--accent)] text-[#0a0a0a] font-mono text-[14px] font-bold py-[13px] px-[28px] rounded-[2px] no-underline transition-[background,transform] duration-150 hover:bg-[var(--accent-dim)] hover:-translate-y-[1px]"
        >
          Start Competing →
        </Link>
        <Link
          href="/problems"
          className="bg-transparent text-[var(--muted)] border border-[var(--border-lit)] font-mono text-[14px] font-medium py-[13px] px-[28px] rounded-[2px] no-underline transition-[color,border-color] duration-150 hover:text-[var(--text)] hover:border-[#555]"
        >
          Browse Problems
        </Link>
      </div>

      {/* Stats */}
      <div className="animate-fade-up-4 flex items-center mt-14 gap-12">
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center gap-12">
            <div className="text-center">
              <div className="font-mono text-[22px] font-bold text-[var(--text)]">
                {s.num}
              </div>
              <div className="font-mono text-[11px] text-[var(--muted)] mt-[3px] tracking-[.06em]">
                {s.label}
              </div>
            </div>
            {i < stats.length - 1 && (
              <div className="w-px h-9 bg-[var(--border-lit)]" />
            )}
          </div>
        ))}
      </div>

      {/* Code Window */}
      <div className="animate-fade-up-5 w-full mt-20 max-w-[680px] bg-[var(--surface)] border border-[var(--border-lit)] rounded-md overflow-hidden">
        {/* Titlebar */}
        <div className="flex items-center gap-2 bg-[#161616] border-b border-[var(--border)] py-2.5 px-4">
          <span className="inline-block w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
          <span className="inline-block w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
          <span className="inline-block w-[10px] h-[10px] rounded-full bg-[#28c840]" />
          <span className="font-mono text-[12px] text-[var(--muted)] ml-2">
            solution.cpp — Problem 1847C
          </span>
          <span className="badge-ac ml-auto font-mono text-[11px] font-bold py-[3px] px-[10px] rounded-[2px]">
            AC · 124ms
          </span>
        </div>

        {/* Code body */}
        <div className="py-5 px-5 pb-6 text-left">
          {codeLines.map((line, i) => (
            <div key={i} className="flex gap-4 font-mono text-[13px] leading-[1.9]">
              <span className="text-[#333] min-w-[16px] text-right select-none">
                {i + 1}
              </span>
              <span>
                {line.map((tok, j) => (
                  <span key={j} className={tokenColors[tok.t] ?? "text-[var(--text)]"}>
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