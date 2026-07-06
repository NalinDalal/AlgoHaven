import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

const defaultStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "1.5rem",
  marginBottom: "1.5rem",
};

export function Card({ children, style }: CardProps) {
  return <div style={{ ...defaultStyle, ...style }}>{children}</div>;
}

/* ─── Section heading (admin pages) ─── */

export interface SectionHeadingProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 12,
  color: "var(--accent)",
  letterSpacing: ".1em",
  textTransform: "uppercase" as const,
  marginBottom: "1.5rem",
};

export function SectionHeading({ children, style }: SectionHeadingProps) {
  return <h3 style={{ ...headingStyle, ...style }}>{children}</h3>;
}
