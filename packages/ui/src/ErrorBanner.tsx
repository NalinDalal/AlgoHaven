import { ReactNode } from "react";

export interface ErrorBannerProps {
  children: ReactNode;
  className?: string;
}

export function ErrorBanner({ children, className = "" }: ErrorBannerProps) {
  return (
    <div className={`bg-[#2d0d0d] border border-[#5c1a1a] text-[var(--red)] p-3 rounded font-mono text-[13px] ${className}`}>
      {children}
    </div>
  );
}

/* ─── Full-page error (for detail pages) ─── */

export interface ErrorPageProps {
  message?: string;
}

export function ErrorPage({ message = "Error loading" }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center font-mono text-[13px] text-[var(--red)] border border-[#5c1a1a] px-6 py-3 rounded-sm">
      {message}
    </div>
  );
}
