'use client';
export default function Footer() {
  return (
    <footer
      className="flex items-center justify-between"
      style={{
        borderTop: "1px solid var(--border)",
        padding: "1.5rem 2.5rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "#333",
        }}
      >
        [AlgoHaven] · Built for competitors, by competitors
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "#333",
        }}
      >
        © 2025
      </span>
    </footer>
  );
}