"use client";

import type { SubmissionResult } from "./problemWrapper";

export default function OutputPanel({ result }: { result: SubmissionResult }) {
    const text = result.compilerOutput || result.judgeOutput || "";
    const isCE = !!result.compilerOutput;

    return (
        <div className="border-t border-zinc-900 bg-zinc-950 shrink-0" style={{ maxHeight: 140 }}>
            {/* Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-1.5 shrink-0">
                <span
                    className={`font-mono text-[9px] tracking-widest uppercase ${isCE ? "text-purple-400" : "text-orange-400"
                        }`}
                >
                    {isCE ? "Compiler Output" : "Judge Output"}
                </span>
            </div>

            {/* Output Content */}
            <pre
                className={`font-mono text-xs px-4 py-3 m-0 whitespace-pre-wrap overflow-y-auto opacity-90
          ${isCE ? "text-purple-400" : "text-orange-400"}`}
                style={{ maxHeight: 100 }}
            >
                {text}
            </pre>
        </div>
    );
}
