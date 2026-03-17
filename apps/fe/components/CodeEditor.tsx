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
      }}
    />
  );
}