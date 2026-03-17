"use client";

import type { SubmissionResult } from "./problemWrapper";

export default function OutputPanel({ result }: { result: SubmissionResult }) {
  const text = result.compilerOutput || result.judgeOutput || "";
  const isCE = !!result.compilerOutput;

  return (
    <div className="border-t border-[#1e1e1e] bg-[#0a0a0a] shrink-0" style={{ maxHeight: 140 }}>
      <div className="bg-[#0d0d0d] border-b border-[#1e1e1e] px-4 py-1.5 shrink-0">
        <span className={`font-mono text-[9px] tracking-widest uppercase ${isCE ? "text-purple-400" : "text-orange-400"}`}>
          {isCE ? "Compiler Output" : "Judge Output"}
        </span>
      </div>
      <pre
        className={`font-mono text-[12px] px-4 py-3 m-0 whitespace-pre-wrap overflow-y-auto opacity-85
          ${isCE ? "text-purple-400" : "text-orange-400"}`}
        style={{ maxHeight: 100 }}
      >
        {text}
      </pre>
    </div>
  );
}