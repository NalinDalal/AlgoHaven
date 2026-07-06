"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";

const navLinks = [
  { href: "/problems", label: "Problems" },
  { href: "/contests", label: "Contests" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/editorial", label: "Editorial" },
  { href: "/admin", label: "Admin" },
];

interface User {
  id: string;
  email: string;
  username: string | null;
  role: string;
}

export default function Nav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/me`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") setUser(d.data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = async () => {
    await apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/signout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 h-15 border-b border-[var(--border)] bg-[rgba(10,10,10,0.85)] backdrop-blur-md">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 no-underline font-mono text-[15px] font-bold text-[var(--text)]"
      >
        <span className="text-[var(--accent)]">[</span>
        AlgoHaven
        <span className="text-[var(--accent)]">]</span>
      </Link>

      {/* Links */}
      <ul className="hidden md:flex gap-8 list-none">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-mono text-[13px] text-[var(--muted)] no-underline transition-colors hover:text-[var(--text)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {loading ? null : user ? (
        <div className="flex items-center gap-4">
          <Link
            href="/me"
            className="font-mono text-[13px] text-[var(--muted)] no-underline"
          >
            {user.username || user.email}
          </Link>
          <button
            onClick={handleSignOut}
            className="font-mono text-[13px] text-[var(--text)] bg-transparent border border-[var(--border)] px-4 py-2 rounded-sm cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <Link
          href="/auth"
          className="font-mono text-[13px] font-bold bg-[var(--accent)] text-black px-5 py-2 rounded-sm no-underline transition-colors hover:bg-[var(--accent-dim)]"
        >
          Sign In
        </Link>
      )}
    </nav>
  );
}