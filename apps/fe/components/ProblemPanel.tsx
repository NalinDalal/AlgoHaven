"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ProblemData, SampleTestCase } from "./problemWrapper";

const DIFF: Record<string, { chip: string; label: string }> = {
  EASY:   { chip: "bg-green-950  border border-green-900  text-green-400",  label: "Easy"   },
  MEDIUM: { chip: "bg-yellow-950 border border-yellow-900 text-yellow-400", label: "Medium" },
  HARD:   { chip: "bg-red-950    border border-red-900    text-red-400",    label: "Hard"   },
};

interface Props {
  problem: ProblemData;
}

export default function ProblemPanel({ problem }: Props) {
  const [activeTab, setActiveTab] = useState<"problem" | "submissions">("problem");
  const ds = DIFF[problem.difficulty] ?? DIFF.MEDIUM;
  const samples = problem.testCases?.filter((tc) => tc.isSample) ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden border-r border-[#1e1e1e]">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-[#1e1e1e]">
        {(["problem", "submissions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`relative flex-1 font-mono text-[11px] uppercase tracking-[.15em] py-3 transition-all duration-150 cursor-pointer border-0 outline-none
              ${activeTab === t
                ? "bg-[#0d0d0d] text-[#e8ff47]"
                : "bg-[#080808] text-zinc-600 hover:text-zinc-400 hover:bg-[#0b0b0b]"}`}
          >
            {activeTab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e8ff47]" />
            )}
            {activeTab === t ? `[ ${t} ]` : t}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "problem"
          ? <ProblemContent problem={problem} ds={ds} samples={samples} />
          : <SubmissionsEmpty />}
      </div>
    </div>
  );
}

// ─── Problem content ──────────────────────────────────────────────────────────

function ProblemContent({
  problem,
  ds,
  samples,
}: {
  problem: ProblemData;
  ds: { chip: string; label: string };
  samples: SampleTestCase[];
}) {
  const [activeSample, setActiveSample] = useState(0);

  return (
    <div className="px-6 py-5 flex flex-col gap-7">
      {/* Title + meta */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-syne font-extrabold text-[clamp(1.2rem,2.2vw,1.6rem)] tracking-tight text-zinc-100 leading-none">
            {problem.title}
          </h1>
          <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-sm ${ds.chip}`}>
            {ds.label}
          </span>
        </div>
        {problem.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] text-zinc-600 border border-[#1e1e1e] px-2 py-0.5 rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Statement */}
      <Section label="PROBLEM">
        <div className="problem-md font-mono text-[13px] leading-relaxed text-zinc-400">
          <ReactMarkdown>{problem.statement}</ReactMarkdown>
        </div>
      </Section>

      {/* Constraints */}
      {problem.constraints && (
        <Section label="CONSTRAINTS">
          <pre className="font-mono text-[13px] text-zinc-400 leading-[1.75] whitespace-pre-wrap m-0">
            {problem.constraints}
          </pre>
        </Section>
      )}

      {/* Examples */}
      {samples.length > 0 && (
        <Section label="EXAMPLES">
          {/* Example tabs */}
          {samples.length > 1 && (
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {samples.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSample(i)}
                  className={`font-mono text-[11px] px-3.5 py-1 rounded-sm cursor-pointer transition-colors border
                    ${activeSample === i
                      ? "bg-[rgba(232,255,71,0.06)] border-[rgba(232,255,71,0.2)] text-[#e8ff47] font-bold"
                      : "bg-transparent border-[#1e1e1e] text-zinc-500 hover:text-zinc-300"}`}
                >
                  Example {i + 1}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <IOBlock label="Input"  value={samples[activeSample].input} />
            <br/>
            <IOBlock label="Output" value={samples[activeSample].expectedOutput} green />
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-mono text-[10px] font-bold text-[#e8ff47] tracking-[.12em]">
        // {label}
      </div>
      {children}
    </div>
  );
}

// ─── IO block ─────────────────────────────────────────────────────────────────

function IOBlock({ label, value, green }: { label: string; value: string; green?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-sm overflow-hidden">
      <div className="bg-[#161616] border-b border-[#1e1e1e] px-3.5 py-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] text-zinc-600 tracking-[.06em] uppercase">{label}</span>
        <button
          onClick={copy}
          className={`font-mono text-[10px] bg-transparent border-none cursor-pointer transition-colors
            ${copied ? "text-[#e8ff47]" : "text-zinc-600 hover:text-zinc-400"}`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre
        className={`font-mono text-[13px] px-3.5 py-2.5 m-0 whitespace-pre-wrap break-all max-h-40 overflow-y-auto
          ${green ? "text-green-400" : "text-[#cdd3de]"}`}
      >
        {value}
      </pre>
    </div>
  );
}

// ─── Submissions empty state ──────────────────────────────────────────────────

function SubmissionsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-64 font-mono text-zinc-700 gap-2 text-center px-6">
      <div className="text-2xl text-zinc-800">[ ]</div>
      <div className="text-[13px]">No submissions yet.</div>
      <div className="text-[11px] text-zinc-800">Submit a solution to see results here.</div>
    </div>
  );
}