"use client";

import { useEffect, useState } from "react";
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
  "ACCEPTED", "WRONG_ANSWER", "TLE", "MLE", "RUNTIME_ERROR", "COMPILE_ERROR",
]);

interface Props {
  problemId: string;
  samples: SampleTestCase[];
  submitEndpoint?: string;
  onVerdict?: (result: SubmissionResult) => void;
}

export default function EditorPanel({ problemId, samples, submitEndpoint, onVerdict }: Props) {
  const [lang, setLang] = useState<Lang>("cpp");
  const [code, setCode] = useState(STARTER_CODE.cpp);
  const [activeSample, setActiveSample] = useState(0);
  const { submitting, result, judgeMsg, submit } = useSubmission(problemId, submitEndpoint);

  // Persist code per problem
  useEffect(() => {
    const saved = localStorage.getItem(problemId);
    if (saved) setCode(saved);
  }, [problemId]);

  useEffect(() => {
    localStorage.setItem(problemId, code);
  }, [code, problemId]);

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
    setLang(l);
    setCode(STARTER_CODE[l]);
  };

  return (
    <div className="flex flex-col overflow-hidden h-full">
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
          onClick={() => setCode(STARTER_CODE[lang])}
          className="font-mono text-[11px] text-zinc-600 bg-transparent border border-[#1e1e1e] px-3 py-1.5 rounded-sm cursor-pointer hover:text-zinc-300 hover:border-[#2e2e2e] transition-colors"
        >
          Reset
        </button>

        <div className="ml-auto flex items-center gap-2">
          {(submitting || result) && (
            <JudgeStatusBadge result={result} judgeMsg={judgeMsg} submitting={submitting} />
          )}
          <button
            onClick={() => submit(code, lang)}
            disabled={submitting}
            className={`font-mono text-[13px] font-bold px-5 py-2 rounded-sm transition-all min-w-[100px] cursor-pointer
              ${submitting
                ? "bg-transparent border border-[#2e2e2e] text-zinc-600 cursor-not-allowed"
                : "bg-[#e8ff47] text-black hover:bg-[#c8df2a] border-0"}`}
          >
            {submitting ? "Judging..." : "Submit →"}
          </button>
        </div>
      </div>

      {/* Monaco */}
      <div className="flex-1 min-h-0">
        <CodeEditor code={code} setCode={setCode} lang={lang} />
      </div>

      {/* Sample strip */}
      {samples.length > 0 && (
        <SampleStrip cases={samples} active={activeSample} setActive={setActiveSample} />
      )}

      {/* Compiler / judge output */}
      {result && (result.compilerOutput || result.judgeOutput) && (
        <OutputPanel result={result} />
      )}
    </div>
  );
}