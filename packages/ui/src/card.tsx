import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded p-6 mb-6 ${className}`}>
      {children}
    </div>
  );
}

/* ─── Section heading (admin pages) ─── */

export interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
}

export function SectionHeading({ children, className = "" }: SectionHeadingProps) {
  return (
    <h3 className={`font-mono text-xs text-[var(--accent)] tracking-widest uppercase mb-6 ${className}`}>
      {children}
    </h3>
  );
}
