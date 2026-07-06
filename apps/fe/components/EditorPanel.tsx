"use client";

import { useEffect, useState, useCallback } from "react";
import CodeEditor from "./CodeEditor";
import SampleStrip from "./SampleStrip";
import OutputPanel from "./OutputPanel";
import JudgeStatusBadge from "./JudgeStatusBadge";
import { useSubmission } from "../hooks/useSubmission";
import type { Lang, SampleTestCase, SubmissionResult } from "./problemWrapper";
import { apiFetch } from "@/lib/apiFetch";

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
    const [code, setCode] = useState("");
    const [activeSample, setActiveSample] = useState(0);
    const [saved, setSaved] = useState(true);
    const [banned, setBanned] = useState(false);

    const { submitting, result, judgeMsg, submit } = useSubmission(
        problemId,
        submitEndpoint,
    );

    useEffect(() => {
        apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/me`, { credentials: "include" })
            .then((r) => r.json())
            .then((d) => { if (d.data?.user?.banned) setBanned(true); })
            .catch(() => { });
    }, []);

    // Persist code per problem
    useEffect(() => {
        const savedCode = localStorage.getItem(`code_${problemId}_${lang}`);
        if (savedCode) setCode(savedCode);
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
                if (!banned) submit(code, lang);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [code, lang, submit, banned]);

    const handleLangChange = (l: Lang) => {
        const savedCode = localStorage.getItem(`code_${problemId}_${l}`);
        setLang(l);
        setCode(savedCode ?? "");
    };

    const formatTime = (ms: number | null) => {
        if (ms === null) return "-";
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#0a0a0a]">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-900 bg-zinc-950 shrink-0">
                {/* Language selector */}
                <select
                    value={lang}
                    onChange={(e) => handleLangChange(e.target.value as Lang)}
                    className="font-mono text-xs bg-zinc-900 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-md cursor-pointer outline-none focus:border-emerald-400 hover:border-zinc-600 transition-colors"
                >
                    {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                        <option key={l} value={l}>
                            {LANG_LABELS[l]}
                        </option>
                    ))}
                </select>

                <button
                    onClick={() => setCode("")}
                    className="font-mono text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-600 px-3 py-1.5 rounded-md transition-colors"
                >
                    Reset
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Status indicators */}
                <div className="flex items-center gap-3">
                    {/* Saved indicator */}
                    <span
                        className={`font-mono text-[9px] transition-colors ${saved ? "text-zinc-600" : "text-yellow-500"
                            }`}
                    >
                        {saved ? "Saved" : "Saving..."}
                    </span>

                    {/* Shortcut hint */}
                    <span className="font-mono text-[9px] text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
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
                    {banned ? (
                        <span className="font-mono text-[11px] text-red-400 bg-red-950/50 border border-red-900 px-4 py-2 rounded">
                            Banned — cannot submit
                        </span>
                    ) : (
                        <button
                            onClick={() => submit(code, lang)}
                            disabled={submitting}
                            className={`font-mono text-xs font-bold px-5 py-2 rounded flex items-center gap-2 transition-all ${submitting
                                    ? "bg-transparent border border-zinc-700 text-zinc-500 cursor-not-allowed"
                                    : "bg-emerald-400 text-black hover:bg-emerald-300 active:bg-emerald-500 hover:-translate-y-px"
                                }`}
                        >
                            {submitting ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-zinc-400 border-t-black rounded-full animate-spin" />
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
                                            strokeWidth={2.5}
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </svg>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0 border-b border-zinc-900">
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

            {/* Output Panel */}
            {result && (result.compilerOutput || result.judgeOutput) && (
                <OutputPanel result={result} />
            )}
        </div>
    );
}
