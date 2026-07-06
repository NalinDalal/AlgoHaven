'use client';
import Link from "next/link";

export default function CtaSection() {
    return (
        <section className="text-center py-24 px-8 border-t border-zinc-800 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(234,255,71,0.015)_40px,rgba(234,255,71,0.015)_41px)]">
            <h2 className="font-bold text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-[-0.03em] mb-6 text-zinc-100">
                Ready to
                <br />
                <span className="text-emerald-400">prove it?</span>
            </h2>

            <p className="font-mono text-sm text-zinc-400 mb-10">
                Join 12,000+ programmers. Free forever.
            </p>

            <Link
                href="/register"
                className="inline-block bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-black font-mono text-[15px] font-bold py-[15px] px-[36px] rounded transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.985]"
            >
                Create your account →
            </Link>
        </section>
    );
}
