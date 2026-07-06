"use client";

import { useEffect } from "react";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error("[RouteError]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1.5rem",
        fontFamily: "var(--font-mono), monospace",
      }}
    >
      <div
        style={{
          background: "#2d0d0d",
          border: "1px solid #5c1a1a",
          color: "var(--red)",
          padding: "1rem 1.5rem",
          borderRadius: 4,
          fontSize: 13,
          maxWidth: 500,
          textAlign: "center",
        }}
      >
        Something went wrong.
      </div>

      {error.digest && (
        <div
          style={{
            fontSize: 11,
            color: "var(--muted)",
            letterSpacing: ".04em",
          }}
        >
          Error ID: {error.digest}
        </div>
      )}

      <button
        onClick={reset}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--accent)",
          padding: "8px 24px",
          borderRadius: 2,
          cursor: "pointer",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 13,
        }}
      >
        Try again
      </button>
    </div>
  );
}
