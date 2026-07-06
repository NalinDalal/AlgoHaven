"use client";

import Editor from "@monaco-editor/react";
import { useRef } from "react";

export default function CodeEditor({
    code,
    setCode,
    lang,
}: {
    code: string;
    setCode: (v: string) => void;
    lang: string;
}) {
    const editorRef = useRef<any>(null);

    return (
        <div className="h-full w-full border border-zinc-700 rounded-lg overflow-hidden bg-[#1e1e1e] shadow-inner">
            <Editor
                height="100%"
                language={lang === "cpp" ? "cpp" : lang}
                value={code}
                theme="vs-dark"
                onMount={(editor) => {
                    editorRef.current = editor;
                    editor.focus();
                }}
                onChange={(value) => setCode(value || "")}
                options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    fontFamily: "JetBrains Mono, monospace",
                    smoothScrolling: true,
                    cursorSmoothCaretAnimation: "on",
                    padding: { top: 12 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                }}
            />
        </div>
    );
}
