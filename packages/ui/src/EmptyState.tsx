import { ReactNode } from "react";

export interface EmptyStateProps {
  children: ReactNode;
  className?: string;
}

export function EmptyState({ children, className = "" }: EmptyStateProps) {
  return (
    <div className={`font-mono text-[13px] text-[var(--muted)] text-center py-12 px-4 ${className}`}>
      {children}
    </div>
  );
}
