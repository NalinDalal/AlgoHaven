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
  kw: "#c792ea",
  fn: "#82aaff",
  str: "#c3e88d",
  cm: "#444",
  num: "#f78c6c",
  var: "var(--text)",
  sp: "var(--text)",
};

export default function Hero() {
  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center text-center relative overflow-hidden"
      style={{ padding: "80px 2rem 4rem" }}
    >
      <div className="grid-bg" />

      {/* Eyebrow */}
      <div
        className="animate-fade-up inline-block mb-8"
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          fontWeight: 500,
          color: "var(--accent)",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          border: "1px solid var(--accent)",
          padding: "5px 14px",
          borderRadius: 2,
        }}
      >
        Competitive Programming Platform
      </div>

      {/* Title */}
      <h1
        className="animate-fade-up-1"
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(3rem, 8vw, 7rem)",
          lineHeight: 0.95,
          letterSpacing: "-.03em",
        }}
      >
        <span style={{ color: "#333" }}>Compete.</span>
        <br />
        <span style={{ color: "var(--text)" }}>Solve.</span>
        <br />
        <span style={{ color: "var(--accent)" }}>
          Dominate
          <span className="animate-blink" style={{ color: "var(--accent)" }}>
            _
          </span>
        </span>
      </h1>

      {/* Subtext */}
      <p
        className="animate-fade-up-2 mt-7"
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 14,
          lineHeight: 1.8,
          color: "var(--muted)",
          maxWidth: 520,
        }}
      >
        Sharpen your algorithms on real contest problems.
        <br />
        <span style={{ color: "var(--text)", fontWeight: 400 }}>
          Real-time leaderboards. Docker-sandboxed judging.
        </span>
        <br />
        Built for serious programmers and first-timers alike.
      </p>

      {/* CTA Buttons */}
      <div
        className="animate-fade-up-3 flex flex-col sm:flex-row gap-4 mt-10 items-center"
      >
        <Link
          href="/register"
          style={{
            background: "var(--accent)",
            color: "#0a0a0a",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 14,
            fontWeight: 700,
            padding: "13px 28px",
            borderRadius: 2,
            textDecoration: "none",
            transition: "background .15s, transform .1s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-dim)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--accent)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Start Competing →
        </Link>
        <Link
          href="/problems"
          style={{
            background: "transparent",
            color: "var(--muted)",
            border: "1px solid var(--border-lit)",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 14,
            fontWeight: 500,
            padding: "13px 28px",
            borderRadius: 2,
            textDecoration: "none",
            transition: "color .15s, border-color .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text)";
            e.currentTarget.style.borderColor = "#555";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.borderColor = "var(--border-lit)";
          }}
        >
          Browse Problems
        </Link>
      </div>

      {/* Stats */}
      <div
        className="animate-fade-up-4 flex items-center mt-14"
        style={{ gap: "3rem" }}
      >
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center" style={{ gap: "3rem" }}>
            <div className="text-center">
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: "var(--muted)",
                  marginTop: 3,
                  letterSpacing: ".06em",
                }}
              >
                {s.label}
              </div>
            </div>
            {i < stats.length - 1 && (
              <div
                style={{
                  width: 1,
                  height: 36,
                  background: "var(--border-lit)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Code Window */}
      <div
        className="animate-fade-up-5 w-full mt-20"
        style={{
          maxWidth: 680,
          background: "var(--surface)",
          border: "1px solid var(--border-lit)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        {/* Titlebar */}
        <div
          className="flex items-center gap-2"
          style={{
            background: "#161616",
            borderBottom: "1px solid var(--border)",
            padding: "10px 16px",
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "var(--muted)",
              marginLeft: 8,
            }}
          >
            solution.cpp — Problem 1847C
          </span>
          <span
            className="badge-ac ml-auto"
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 2,
            }}
          >
            AC · 124ms
          </span>
        </div>

        {/* Code body */}
        <div style={{ padding: "20px 20px 24px", textAlign: "left" }}>
          {codeLines.map((line, i) => (
            <div
              key={i}
              className="flex gap-4"
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 13,
                lineHeight: 1.9,
              }}
            >
              <span style={{ color: "#333", minWidth: 16, textAlign: "right", userSelect: "none" }}>
                {i + 1}
              </span>
              <span>
                {line.map((tok, j) => (
                  <span key={j} style={{ color: tokenColors[tok.t] ?? "var(--text)" }}>
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