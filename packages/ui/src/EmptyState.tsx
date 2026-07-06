import { ReactNode } from "react";

export interface EmptyStateProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

export function EmptyState({ children, style }: EmptyStateProps) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 13,
        color: "var(--muted)",
        textAlign: "center",
        padding: "3rem 1rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
