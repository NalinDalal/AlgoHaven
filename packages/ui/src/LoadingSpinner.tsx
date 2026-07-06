"use client";

export interface LoadingSpinnerProps {
  fullPage?: boolean;
  message?: string;
  className?: string;
}

export function LoadingSpinner({ fullPage = false, message, className = "" }: LoadingSpinnerProps) {
  return (
    <div
      className={`flex items-center font-mono text-[var(--muted)] gap-2.5 ${
        fullPage ? "min-h-screen bg-[var(--bg)] justify-center" : ""
      } ${className}`}
    >
      <div
        className={`rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-[spin_0.8s_linear_infinite] ${
          fullPage ? "w-8 h-8" : "w-3.5 h-3.5 shrink-0"
        }`}
      />
      {message && <span className="text-[13px]">{message}</span>}
    </div>
  );
}
