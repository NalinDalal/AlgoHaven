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
        <div className="border-t border-zinc-900 bg-zinc-950 shrink-0 flex flex-col" style={{ maxHeight: 170 }}>
            {/* Tab row */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-zinc-900 overflow-x-auto shrink-0">
                <span className="font-mono text-[9px] tracking-widest text-zinc-600 mr-3 shrink-0 uppercase">
                    Cases
                </span>
                {cases.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`font-mono text-xs px-3 py-1 rounded-sm cursor-pointer shrink-0 transition-all border
              ${active === i
                                ? "bg-emerald-950/60 border-emerald-400/30 text-emerald-400"
                                : "bg-transparent border-zinc-900 text-zinc-500 hover:text-zinc-400 hover:border-zinc-700"
                            }`}
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
        <div className={`flex flex-col overflow-hidden ${borderLeft ? "border-l border-zinc-900" : ""}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-2 pb-1.5 shrink-0">
                <span className="font-mono text-[9px] tracking-widest text-zinc-600 uppercase">
                    {label}
                </span>
                <button
                    onClick={copy}
                    className={`font-mono text-[9px] transition-colors ${copied ? "text-emerald-400" : "text-zinc-600 hover:text-zinc-400"
                        }`}
                >
                    {copied ? "✓ COPIED" : "COPY"}
                </button>
            </div>

            {/* Content */}
            <pre
                className={`font-mono text-xs px-4 pb-4 m-0 whitespace-pre-wrap break-all overflow-y-auto flex-1
          ${green ? "text-emerald-400" : "text-zinc-300"}`}
            >
                {value || ""}
            </pre>
        </div>
    );
}
