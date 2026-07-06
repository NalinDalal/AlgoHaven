import { ReactNode } from "react";

export interface ErrorBannerProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

const bannerStyle: React.CSSProperties = {
  background: "#2d0d0d",
  border: "1px solid #5c1a1a",
  color: "var(--red)",
  padding: "0.75rem",
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "var(--font-mono), monospace",
};

export function ErrorBanner({ children, style }: ErrorBannerProps) {
  return <div style={{ ...bannerStyle, ...style }}>{children}</div>;
}

/* ─── Full-page error (for detail pages) ─── */

export interface ErrorPageProps {
  message?: string;
}

export function ErrorPage({ message = "Error loading" }: ErrorPageProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono), monospace",
        fontSize: 13,
        color: "var(--red)",
        border: "1px solid #5c1a1a",
        padding: "12px 24px",
        borderRadius: 2,
      }}
    >
      {message}
    </div>
  );
}
