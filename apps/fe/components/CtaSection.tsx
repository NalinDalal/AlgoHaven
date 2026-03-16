'use client';
import Link from "next/link";

export default function CtaSection() {
  return (
    <section
      className="text-center"
      style={{
        padding: "6rem 2rem",
        borderTop: "1px solid var(--border)",
        background: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 40px,
          rgba(232,255,71,.015) 40px,
          rgba(232,255,71,.015) 41px
        )`,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(2.5rem, 6vw, 5rem)",
          lineHeight: 1,
          letterSpacing: "-.03em",
          marginBottom: "1.5rem",
          color: "var(--text)",
        }}
      >
        Ready to
        <br />
        <span style={{ color: "var(--accent)" }}>prove it?</span>
      </h2>

      <p
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 14,
          color: "var(--muted)",
          marginBottom: "2.5rem",
        }}
      >
        Join 12,000+ programmers. Free forever.
      </p>

      <Link
        href="/register"
        style={{
          background: "var(--accent)",
          color: "#0a0a0a",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 15,
          fontWeight: 700,
          padding: "15px 36px",
          borderRadius: 2,
          textDecoration: "none",
          display: "inline-block",
          transition: "background .15s, transform .1s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--accent-dim)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--accent)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Create your account →
      </Link>
    </section>
  );
}