import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-surface border border-border shadow-panel ${className}`}>
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
    <h3 className={`font-mono text-xs text-accent tracking-[0.14em] uppercase font-bold mb-6 flex items-center gap-2 ${className}`}>
      <span className="text-muted-2">//</span>
      {children}
    </h3>
  );
}
