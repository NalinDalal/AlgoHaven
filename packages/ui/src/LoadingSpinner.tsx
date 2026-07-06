"use client";

import { CSSProperties } from "react";

export interface LoadingSpinnerProps {
  /** Show as full-page centered loader */
  fullPage?: boolean;
  /** Text shown next to the spinner */
  message?: string;
  /** Override container style */
  style?: CSSProperties;
}

const containerStyle: CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--font-mono), monospace",
  color: "var(--muted)",
  gap: 10,
};

const inlineContainerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontFamily: "var(--font-mono), monospace",
  fontSize: 13,
  color: "var(--muted)",
  gap: 10,
};

const spinnerStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "2px solid #3f3f46",
  borderTopColor: "#a1a1aa",
  animation: "spin 0.8s linear infinite",
};

const smallSpinnerStyle: CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: "50%",
  border: "2px solid #3f3f46",
  borderTopColor: "#a1a1aa",
  animation: "spin 0.8s linear infinite",
  flexShrink: 0,
};

/* Inline keyframes injected once at the module level */
const styleTag = typeof document !== "undefined"
  ? (() => {
      const id = "spinner-keyframes";
      if (!document.getElementById(id)) {
        const el = document.createElement("style");
        el.id = id;
        el.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(el);
      }
      return null;
    })()
  : null;

export function LoadingSpinner({ fullPage = false, message, style }: LoadingSpinnerProps) {
  return (
    <div style={{ ...(fullPage ? containerStyle : inlineContainerStyle), ...style }}>
      <div style={fullPage ? spinnerStyle : smallSpinnerStyle} />
      {message && <span>{message}</span>}
    </div>
  );
}
