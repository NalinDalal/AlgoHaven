"use client";

import { useEffect, useState, useCallback } from "react";
import CodeEditor from "./CodeEditor";
import SampleStrip from "./SampleStrip";
import OutputPanel from "./OutputPanel";
import JudgeStatusBadge from "./JudgeStatusBadge";
import { useSubmission } from "../hooks/useSubmission";
import { STARTER_CODE } from "./problemWrapper";
import type { Lang, SampleTestCase, SubmissionResult } from "./problemWrapper";

const LANG_LABELS: Record<Lang, string> = {
  cpp: "C++17",
  python: "Python 3",
  java: "Java 21",
  javascript: "JavaScript",
};

const TERMINAL_STATUSES = new Set([
  "ACCEPTED",
  "WRONG_ANSWER",
  "TLE",
  "MLE",
  "RUNTIME_ERROR",
  "COMPILE_ERROR",
]);

interface RunResult {
  status: string;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
}

interface Props {
  problemId: string;
  samples: SampleTestCase[];
  submitEndpoint?: string;
  onVerdict?: (result: SubmissionResult) => void;
}

export default function EditorPanel({
  problemId,
  samples,
  submitEndpoint,
  onVerdict,
}: Props) {
  const [lang, setLang] = useState<Lang>("cpp");
  const [code, setCode] = useState(STARTER_CODE.cpp);
  const [activeSample, setActiveSample] = useState(0);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(true);
  const [runMsg, setRunMsg] = useState("");
  const { submitting, result, judgeMsg, submit } = useSubmission(
    problemId,
    submitEndpoint,
  );

  // Persist code per problem
  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${problemId}_${lang}`);
    if (savedCode) setCode(savedCode);
    else setCode(STARTER_CODE[lang]);
  }, [problemId, lang]);

  useEffect(() => {
    localStorage.setItem(`code_${problemId}_${lang}`, code);
    setSaved(true);
  }, [code, problemId, lang]);

  // Fire onVerdict on terminal status
  useEffect(() => {
    if (result && TERMINAL_STATUSES.has(result.status)) {
      onVerdict?.(result);
    }
  }, [result, onVerdict]);

  // Ctrl+Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        submit(code, lang);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [code, lang, submit]);

  const handleLangChange = (l: Lang) => {
    const savedCode = localStorage.getItem(`code_${problemId}_${l}`);
    setLang(l);
    setCode(savedCode ?? STARTER_CODE[l]);
  };

  // Run code against current sample (no submission)
  const runCode = useCallback(async () => {
    if (!samples[activeSample]) return;

    setRunning(true);
    setRunResult(null);
    setRunMsg("Running on samples...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${problemId}/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ code, language: lang }),
        },
      );

      const d = await res.json();
      const runId = d.data?.runId;

      if (runId) {
        // Poll for results (simulate for now - worker needs to support run queries)
        // For now, just show sample I/O
        setTimeout(() => {
          const input = samples[activeSample].input;
          const expected = samples[activeSample].expectedOutput;
          setRunResult({
            status: "READY",
            stdout: `Sample #${activeSample + 1}\n\nInput:\n${input}\n\nExpected Output:\n${expected}`,
            stderr: "Click Submit to run against all test cases",
            executionTimeMs: 0,
          });
          setRunning(false);
          setRunMsg("");
        }, 500);
      }
    } catch (err) {
      setRunResult({
        status: "ERROR",
        stdout: "",
        stderr: "Failed to run code",
        executionTimeMs: 0,
      });
      setRunning(false);
      setRunMsg("");
    }
  }, [code, lang, problemId, samples, activeSample]);

  const formatTime = (ms: number | null) => {
    if (ms === null) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="flex flex-col overflow-hidden h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e1e1e] bg-[#0d0d0d] shrink-0">
        {/* Language selector */}
        <select
          value={lang}
          onChange={(e) => handleLangChange(e.target.value as Lang)}
          className="font-mono text-xs bg-[#151515] text-zinc-300 border border-[#252525] px-3 py-1.5 rounded cursor-pointer outline-none focus:border-[#e8ff47]"
        >
          {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
            <option key={l} value={l}>
              {LANG_LABELS[l]}
            </option>
          ))}
        </select>

        <button
          onClick={() => setCode(STARTER_CODE[lang])}
          className="font-mono text-[10px] text-zinc-500 bg-transparent border border-[#252525] px-3 py-1.5 rounded cursor-pointer hover:text-zinc-300 hover:border-[#353535] transition-colors"
        >
          Reset
        </button>

        {/* Run button */}
        <button
          onClick={runCode}
          disabled={running || !samples.length}
          className="font-mono text-[11px] flex items-center gap-1.5 bg-[#151515] text-zinc-400 border border-[#252525] px-3 py-1.5 rounded cursor-pointer hover:text-zinc-200 hover:border-[#353535] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <span className="w-3 h-3 border border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
          Run
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status indicators */}
        <div className="flex items-center gap-3">
          {/* Saved indicator */}
          <span
            className={`font-mono text-[9px] transition-colors ${saved ? "text-zinc-700" : "text-yellow-600"}`}
          >
            {saved ? "Saved" : "Saving..."}
          </span>

          {/* Shortcut hint */}
          <span className="font-mono text-[9px] text-zinc-700 bg-[#151515] px-2 py-1 rounded">
            Ctrl+Enter to submit
          </span>

          {/* Judge status */}
          {(submitting || result) && (
            <JudgeStatusBadge
              result={result}
              judgeMsg={judgeMsg}
              submitting={submitting}
            />
          )}

          {/* Submit button */}
          <button
            onClick={() => submit(code, lang)}
            disabled={submitting}
            className={`font-mono text-[12px] font-bold px-4 py-2 rounded transition-all cursor-pointer flex items-center gap-2
              ${
                submitting
                  ? "bg-transparent border border-[#252525] text-zinc-600 cursor-not-allowed"
                  : "bg-[#e8ff47] text-black hover:bg-[#c8df2a] border-0"
              }`}
          >
            {submitting ? (
              <>
                <span className="w-3 h-3 border-2 border-zinc-500 border-t-black rounded-full animate-spin" />
                Judging...
              </>
            ) : (
              <>
                Submit
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco */}
      <div className="flex-1 min-h-0">
        <CodeEditor code={code} setCode={setCode} lang={lang} />
      </div>

      {/* Sample strip */}
      {samples.length > 0 && (
        <SampleStrip
          cases={samples}
          active={activeSample}
          setActive={setActiveSample}
        />
      )}

      {/* Run output */}
      {runResult && (
        <div className="border-t border-[#1e1e1e] bg-[#0c0c0c]">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e1e1e]">
            <span className="font-mono text-[10px] font-bold text-zinc-500">
              RUN OUTPUT
            </span>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                runResult.status === "READY"
                  ? "text-green-400 bg-green-950"
                  : runResult.status === "ERROR"
                    ? "text-red-400 bg-red-950"
                    : "text-zinc-400 bg-zinc-900"
              }`}
            >
              {runResult.status}
            </span>
            {runResult.executionTimeMs > 0 && (
              <span className="font-mono text-[9px] text-zinc-600 ml-auto">
                {formatTime(runResult.executionTimeMs)}
              </span>
            )}
          </div>
          <div className="px-3 py-2 max-h-32 overflow-auto">
            <pre className="font-mono text-[11px] text-zinc-400 whitespace-pre-wrap">
              {runResult.stdout || runResult.stderr || "No output"}
            </pre>
          </div>
        </div>
      )}

      {/* Compiler / judge output */}
      {result && (result.compilerOutput || result.judgeOutput) && (
        <OutputPanel result={result} />
      )}
    </div>
  );
}
