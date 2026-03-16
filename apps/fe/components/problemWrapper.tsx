"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Nav from "@/components/Nav";

// ─── Public types (import these in page.tsx too) ─────────────────────────────

export interface SampleTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: true;
  points: number;
}

export interface ProblemData {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  statement: string;
  constraints?: string;
  tags: string[];
  timeLimitMs: number;
  memoryLimitKb: number;
  testCases: SampleTestCase[];
}

export type SubmissionStatus =
  | "QUEUED" | "RUNNING" | "ACCEPTED" | "WRONG_ANSWER"
  | "TLE" | "MLE" | "RUNTIME_ERROR" | "COMPILE_ERROR";

export interface SubmissionResult {
  id: string;
  status: SubmissionStatus;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  compilerOutput?: string;
  judgeOutput?: string;
  points?: number;
}

export type Lang = "cpp" | "python" | "java" | "javascript";

// ─── Internal constants ───────────────────────────────────────────────────────

const DIFF: Record<string, { chip: string; label: string }> = {
  EASY:   { chip: "bg-green-950  border border-green-900  text-green-400",  label: "Easy"   },
  MEDIUM: { chip: "bg-yellow-950 border border-yellow-900 text-yellow-400", label: "Medium" },
  HARD:   { chip: "bg-red-950    border border-red-900    text-red-400",    label: "Hard"   },
};

const STATUS: Record<SubmissionStatus, { chip: string; dot: string; label: string; live: boolean }> = {
  QUEUED:        { chip: "bg-zinc-900 border border-zinc-700 text-zinc-400",       dot: "bg-zinc-400",   label: "In Queue",               live: true  },
  RUNNING:       { chip: "bg-yellow-950 border border-yellow-900 text-yellow-400", dot: "bg-yellow-400", label: "Running...",              live: true  },
  ACCEPTED:      { chip: "bg-green-950 border border-green-900 text-green-400",    dot: "bg-green-400",  label: "Accepted",               live: false },
  WRONG_ANSWER:  { chip: "bg-red-950 border border-red-900 text-red-400",          dot: "bg-red-400",    label: "Wrong Answer",           live: false },
  TLE:           { chip: "bg-yellow-950 border border-yellow-900 text-yellow-400", dot: "bg-yellow-400", label: "Time Limit Exceeded",    live: false },
  MLE:           { chip: "bg-blue-950 border border-blue-900 text-blue-400",       dot: "bg-blue-400",   label: "Memory Limit Exceeded",  live: false },
  RUNTIME_ERROR: { chip: "bg-orange-950 border border-orange-900 text-orange-400", dot: "bg-orange-400", label: "Runtime Error",          live: false },
  COMPILE_ERROR: { chip: "bg-purple-950 border border-purple-900 text-purple-400", dot: "bg-purple-400", label: "Compile Error",          live: false },
};

const LANG_LABELS: Record<Lang, string> = {
  cpp: "C++17", python: "Python 3", java: "Java 21", javascript: "JavaScript",
};

export const STARTER_CODE: Record<Lang, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // read from cin, write to cout

    return 0;
}`,
  python: `import sys
input = sys.stdin.readline

def solve():
    # read from stdin, print to stdout
    pass

solve()`,
  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(
            new InputStreamReader(System.in));
        PrintWriter out = new PrintWriter(
            new BufferedWriter(new OutputStreamWriter(System.out)));

        // read from br, write via out.println()

        out.flush();
    }
}`,
  javascript: `const lines = require('fs')
  .readFileSync('/dev/stdin', 'utf8')
  .trim().split('\\n');

let ptr = 0;
const rd = () => lines[ptr++];

// read via rd(), write via console.log()
`,
};

const TERMINAL: SubmissionStatus[] = [
  "ACCEPTED", "WRONG_ANSWER", "TLE", "MLE", "RUNTIME_ERROR", "COMPILE_ERROR",
];

type LeftTab = "problem" | "submissions";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProblemWrapperProps {
  problem: ProblemData;
  // Optional: override the submit endpoint (defaults to /api/problems/:id/submission)
  submitEndpoint?: string;
  // Optional: called after a terminal verdict is received
  onVerdict?: (result: SubmissionResult) => void;
}

// ─── Wrapper ─────────────────────────────────────────────────────────────────

export default function ProblemWrapper({
  problem,
  submitEndpoint,
  onVerdict,
}: ProblemWrapperProps) {
  const [leftTab, setLeftTab]           = useState<LeftTab>("problem");
  const [lang, setLang]                 = useState<Lang>("cpp");
  const [code, setCode]                 = useState(STARTER_CODE.cpp);
  const [submitting, setSubmitting]     = useState(false);
  const [result, setResult]             = useState<SubmissionResult | null>(null);
  const [judgeMsg, setJudgeMsg]         = useState("");
  const [activeSample, setActiveSample] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ds = DIFF[problem.difficulty] ?? DIFF.MEDIUM;
  const samples = problem.testCases?.filter((tc) => tc.isSample) ?? [];

  const handleLangChange = (l: Lang) => { setLang(l); setCode(STARTER_CODE[l]); };

  const pollStatus = (sid: string, attempt = 0) => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/submissions/${sid}/status`)
      .then((r) => r.json())
      .then((d: SubmissionResult) => {
        setResult(d);
        if (d.status === "QUEUED")  setJudgeMsg("Waiting in queue...");
        if (d.status === "RUNNING") setJudgeMsg(`Running on test ${Math.min(attempt + 1, 10)}...`);
        if (!TERMINAL.includes(d.status)) {
          pollRef.current = setTimeout(() => pollStatus(sid, attempt + 1), 1200);
        } else {
          setSubmitting(false);
          setJudgeMsg("");
          onVerdict?.(d);
        }
      })
      .catch(() => { setSubmitting(false); setJudgeMsg(""); });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    setJudgeMsg("Submitting...");
    const endpoint = submitEndpoint
      ?? `${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${problem.id}/submission`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: lang }),
      });
      const d = await res.json();
      const sid = d.submissionId ?? d.id;
      if (sid) { setJudgeMsg("Queued..."); pollStatus(sid); }
      else { setSubmitting(false); setJudgeMsg(""); }
    } catch {
      setSubmitting(false);
      setJudgeMsg("");
    }
  };

  return (
    <>
      <Nav />
      <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: 70, overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* ── Breadcrumb ── */}
        <div className="border-b border-[#1e1e1e] px-5 h-10 flex items-center gap-2 shrink-0 font-mono text-xs text-zinc-500">
          <Link href="/problems" className="hover:text-[#e8ff47] transition-colors">
            Problems
          </Link>
          <span className="text-[#2e2e2e]">/</span>
          <span className="text-zinc-200 max-w-xs truncate">{problem.title}</span>
          <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-sm ${ds.chip}`}>
            {ds.label}
          </span>
          <div className="ml-auto flex gap-4 text-[11px] text-zinc-700">
            <span>TL: {problem.timeLimitMs}ms</span>
            <span>ML: {Math.round(problem.memoryLimitKb / 1024)}MB</span>
          </div>
        </div>

        {/* ── Split pane ── */}
        <div
          className="flex-1 grid grid-cols-2 md:grid-cols-2 sm:grid-cols-1 overflow-hidden"
          style={{ height: "calc(100vh - 100px)" }}
        >
          {/* ════ LEFT ════ */}
          <div className="border-r border-[#1e1e1e] flex flex-col overflow-hidden">
            <div className="flex border-b border-[#1e1e1e] bg-[#0d0d0d] shrink-0">
              {(["problem", "submissions"] as LeftTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setLeftTab(t)}
                  className={`font-mono text-[11px] uppercase tracking-widest px-5 py-2.5 border-b-2 transition-colors cursor-pointer bg-transparent border-x-0 border-t-0
                    ${leftTab === t
                      ? "border-[#e8ff47] text-[#e8ff47] font-bold"
                      : "border-transparent text-zinc-600 hover:text-zinc-400"}`}
                >
                  {t}
                </button>
              ))}
            </div>
           <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-6">
  {leftTab === "problem" ? (
    <ProblemContent
      problem={problem}
      ds={ds}
      samples={samples}
      activeSample={activeSample}
      setActiveSample={setActiveSample}
    />
  ) : (
    <SubmissionsTab />
  )}
</div>
          </div>

          {/* ════ RIGHT: Editor ════ */}
          <div className="flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 border-b border-[#1e1e1e] bg-[#0d0d0d] shrink-0">
              <select
                value={lang}
                onChange={(e) => handleLangChange(e.target.value as Lang)}
                className="font-mono text-xs bg-[#111] text-zinc-200 border border-[#2e2e2e] px-2.5 py-1.5 rounded-sm cursor-pointer outline-none"
              >
                {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                  <option key={l} value={l}>{LANG_LABELS[l]}</option>
                ))}
              </select>

              <button
                onClick={() => { setCode(STARTER_CODE[lang]); setResult(null); }}
                className="font-mono text-[11px] text-zinc-600 bg-transparent border border-[#1e1e1e] px-3 py-1.5 rounded-sm cursor-pointer hover:text-zinc-300 hover:border-[#2e2e2e] transition-colors"
              >
                Reset
              </button>

              <div className="ml-auto flex items-center gap-2">
                {(submitting || result) && (
                  <JudgeStatusBadge result={result} judgeMsg={judgeMsg} submitting={submitting} />
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`font-mono text-[13px] font-bold px-5 py-2 rounded-sm transition-all min-w-25 cursor-pointer
                    ${submitting
                      ? "bg-transparent border border-[#2e2e2e] text-zinc-600 cursor-not-allowed"
                      : "bg-[#e8ff47] text-black hover:bg-[#c8df2a] border-0"}`}
                >
                  {submitting ? "Judging..." : "Submit →"}
                </button>
              </div>
            </div>

            {/* Code textarea — swap for @monaco-editor/react */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-[#0d0d0d] text-[#cdd3de] font-mono text-[13px] leading-7 p-5 border-none outline-none resize-none"
              style={{ tabSize: 4 }}
            />

            {/* Sample strip */}
            {samples.length > 0 && (
              <SampleCaseStrip cases={samples} active={activeSample} setActive={setActiveSample} />
            )}

            {/* CE / RE output */}
            {result && (result.compilerOutput || result.judgeOutput) && (
              <OutputPanel result={result} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components (internal to wrapper) ────────────────────────────────────

function JudgeStatusBadge({ result, judgeMsg, submitting }: {
  result: SubmissionResult | null;
  judgeMsg: string;
  submitting: boolean;
}) {
  if (submitting && !result) {
    return (
      <span className="font-mono text-[11px] text-zinc-500 flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e8ff47] animate-pulse" />
        {judgeMsg || "Submitting..."}
      </span>
    );
  }
  if (!result) return null;
  const s = STATUS[result.status];
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-[11px] font-bold px-3 py-1 rounded-sm flex items-center gap-1.5 ${s.chip}`}>
        {s.live && <span className={`inline-block w-1 h-1 rounded-full ${s.dot} animate-pulse`} />}
        {judgeMsg || s.label}
      </span>
      {result.status === "ACCEPTED" && result.executionTimeMs != null && (
        <span className="font-mono text-[11px] text-zinc-600">
          {Math.round(result.executionTimeMs)}ms
          {result.memoryUsedKb != null &&
            ` · ${(Math.round(result.memoryUsedKb / 1024 * 10) / 10).toFixed(1)}MB`}
        </span>
      )}
    </div>
  );
}

function ProblemContent({ problem, ds, samples, activeSample, setActiveSample }: {
  problem: ProblemData;
  ds: { chip: string; label: string };
  samples: SampleTestCase[];
  activeSample: number;
  setActiveSample: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap mb-3">
          <h1 className="font-syne font-extrabold text-[clamp(1.3rem,2.5vw,1.75rem)] tracking-tight text-zinc-100 leading-none">
            {problem.title}
          </h1>
          <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-sm ${ds.chip}`}>
            {ds.label}
          </span>
        </div>
        {problem.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {problem.tags.map((tag) => (
              <span key={tag} className="font-mono text-[10px] text-zinc-600 border border-[#1e1e1e] px-2 py-0.5 rounded-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Section label="PROBLEM">
        <div className="problem-md font-mono text-[13px] leading-[1.85] text-zinc-400">
          <ReactMarkdown>{problem.statement}</ReactMarkdown>
        </div>
      </Section>

      {problem.constraints && (
        <Section label="CONSTRAINTS">
          <pre className="font-mono text-[13px] text-zinc-400 leading-[1.8] whitespace-pre-wrap m-0">
            {problem.constraints}
          </pre>
        </Section>
      )}

      {samples.length > 0 && (
        <Section label="EXAMPLES">
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {samples.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSample(i)}
                className={`font-mono text-[11px] px-3.5 py-1 rounded-sm cursor-pointer transition-colors
                  ${activeSample === i
                    ? "bg-[rgba(232,255,71,0.06)] border border-[rgba(232,255,71,0.2)] text-[#e8ff47] font-bold"
                    : "bg-transparent border border-[#1e1e1e] text-zinc-500 hover:text-zinc-300"}`}
              >
                Example {i + 1}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <IOBlock label="Input"  value={samples[activeSample].input} />
            <IOBlock label="Output" value={samples[activeSample].expectedOutput} green />
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] font-bold text-[#e8ff47] tracking-[.12em] mb-2">
        // {label}
      </div>
      {children}
    </div>
  );
}

function IOBlock({ label, value, green }: { label: string; value: string; green?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-sm overflow-hidden">
      <div className="bg-[#161616] border-b border-[#1e1e1e] px-3 py-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] text-zinc-600 tracking-[.08em]">{label}</span>
        <button
          onClick={copy}
          className={`font-mono text-[10px] bg-transparent border-none cursor-pointer transition-colors
            ${copied ? "text-[#e8ff47]" : "text-zinc-600 hover:text-zinc-400"}`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className={`font-mono text-[13px] p-3 m-0 whitespace-pre-wrap break-all
        ${green ? "text-green-400" : "text-[#cdd3de]"}`}>
        {value}
      </pre>
    </div>
  );
}

function SampleCaseStrip({ cases, active, setActive }: {
  cases: SampleTestCase[];
  active: number;
  setActive: (i: number) => void;
}) {
  return (
    <div className="border-t border-[#1e1e1e] bg-[#0d0d0d] shrink-0 max-h-42.5 flex flex-col">
      <div className="flex items-center gap-1.5 px-3.5 py-1.5 border-b border-[#1e1e1e] overflow-x-auto">
        <span className="font-mono text-[9px] text-zinc-600 tracking-widest mr-1 shrink-0">
          SAMPLE CASES
        </span>
        {cases.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`font-mono text-[11px] px-3 py-0.5 rounded-sm cursor-pointer shrink-0 transition-colors
              ${active === i
                ? "bg-[rgba(232,255,71,0.06)] border border-[rgba(232,255,71,0.2)] text-[#e8ff47]"
                : "bg-transparent border border-[#1e1e1e] text-zinc-600 hover:text-zinc-400"}`}
          >
            Case {i + 1}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 flex-1 overflow-hidden">
        <div className="border-r border-[#1e1e1e] p-2.5 overflow-auto">
          <div className="font-mono text-[9px] text-zinc-600 tracking-[.08em] mb-1">INPUT</div>
          <pre className="font-mono text-xs text-[#cdd3de] m-0 whitespace-pre-wrap">
            {cases[active]?.input}
          </pre>
        </div>
        <div className="p-2.5 overflow-auto">
          <div className="font-mono text-[9px] text-zinc-600 tracking-[.08em] mb-1">EXPECTED OUTPUT</div>
          <pre className="font-mono text-xs text-green-400 m-0 whitespace-pre-wrap">
            {cases[active]?.expectedOutput}
          </pre>
        </div>
      </div>
    </div>
  );
}

function OutputPanel({ result }: { result: SubmissionResult }) {
  const text = result.compilerOutput || result.judgeOutput || "";
  const isCE = !!result.compilerOutput;
  return (
    <div className="border-t border-[#1e1e1e] bg-[#0a0a0a] shrink-0 max-h-35">
      <div className="bg-[#0d0d0d] border-b border-[#1e1e1e] px-3.5 py-1">
        <span className={`font-mono text-[9px] tracking-widest ${isCE ? "text-purple-400" : "text-orange-400"}`}>
          {isCE ? "COMPILER OUTPUT" : "JUDGE OUTPUT"}
        </span>
      </div>
      <pre className={`font-mono text-xs p-3.5 m-0 whitespace-pre-wrap overflow-y-auto max-h-25 opacity-85
        ${isCE ? "text-purple-400" : "text-orange-400"}`}>
        {text}
      </pre>
    </div>
  );
}

function SubmissionsTab() {
  return (
    <div className="flex flex-col items-center justify-center h-75 font-mono text-zinc-600 gap-2 text-center">
      <div className="text-[26px] text-zinc-800">[ ]</div>
      <div className="text-[13px]">No submissions yet.</div>
      <div className="text-[11px] text-zinc-800">Submit a solution to see results here.</div>
    </div>
  );
}