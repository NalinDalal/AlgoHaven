"use client";

import { useState } from "react";
import type { SampleTestCase } from "./problemWrapper";

interface Props {
  cases: SampleTestCase[];
  active: number;
  setActive: (i: number) => void;
}

export default function SampleStrip({ cases, active, setActive }: Props) {
  return (
    <div className="border-t border-[#1e1e1e] bg-[#0d0d0d] shrink-0 flex flex-col" style={{ maxHeight: 170 }}>
      {/* Tab row */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#1e1e1e] overflow-x-auto shrink-0">
        <span className="font-mono text-[9px] tracking-widest text-zinc-700 mr-2 shrink-0 uppercase">
          Cases
        </span>
        {cases.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`font-mono text-[11px] px-3 py-0.5 rounded-sm cursor-pointer shrink-0 transition-colors border
              ${active === i
                ? "bg-[rgba(232,255,71,0.06)] border-[rgba(232,255,71,0.2)] text-[#e8ff47]"
                : "bg-transparent border-[#1e1e1e] text-zinc-600 hover:text-zinc-400 hover:border-[#2e2e2e]"}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Input / Output columns */}
      <div className="grid grid-cols-2 flex-1 overflow-hidden min-h-0">
        <IOPane label="INPUT" value={cases[active]?.input} />
        <IOPane label="EXPECTED" value={cases[active]?.expectedOutput} green borderLeft />
      </div>
    </div>
  );
}

function IOPane({
  label,
  value,
  green,
  borderLeft,
}: {
  label: string;
  value?: string;
  green?: boolean;
  borderLeft?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className={`flex flex-col overflow-hidden ${borderLeft ? "border-l border-[#1e1e1e]" : ""}`}>
      <div className="flex items-center justify-between px-3.5 pt-2 pb-1 shrink-0">
        <span className="font-mono text-[9px] tracking-[.08em] text-zinc-700 uppercase">{label}</span>
        <button
          onClick={copy}
          className={`font-mono text-[9px] bg-transparent border-none cursor-pointer transition-colors
            ${copied ? "text-[#e8ff47]" : "text-zinc-700 hover:text-zinc-400"}`}
        >
          {copied ? "✓" : "copy"}
        </button>
      </div>
      <pre
        className={`font-mono text-[12px] px-3.5 pb-2.5 m-0 whitespace-pre-wrap break-all overflow-y-auto flex-1
          ${green ? "text-green-400" : "text-[#cdd3de]"}`}
      >
        {value}
      </pre>
    </div>
  );
}