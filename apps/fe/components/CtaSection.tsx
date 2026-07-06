'use client';
import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="text-center py-24 px-8 border-t border-[var(--border)] bg-[repeating-linear-gradient(45deg,transparent,transparent 40px,rgba(232,255,71,.015) 40px,rgba(232,255,71,.015) 41px)]">
      <h2 className="font-[family-name:var(--font-syne)] font-extrabold text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-[-.03em] mb-6 text-[var(--text)]">
        Ready to
        <br />
        <span className="text-[var(--accent)]">prove it?</span>
      </h2>

      <p className="font-mono text-[14px] text-[var(--muted)] mb-10">
        Join 12,000+ programmers. Free forever.
      </p>

      <Link
        href="/register"
        className="bg-[var(--accent)] text-[#0a0a0a] font-mono text-[15px] font-bold py-[15px] px-[36px] rounded-[2px] no-underline inline-block transition-[background,transform] duration-150 hover:bg-[var(--accent-dim)] hover:-translate-y-[1px]"
      >
        Create your account →
      </Link>
    </section>
  );
}
