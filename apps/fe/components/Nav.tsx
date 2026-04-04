"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/me`, {
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
    await fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/signout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 h-15 border-b"
      style={{
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 no-underline"
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontWeight: 700,
          fontSize: 15,
          color: "var(--text)",
        }}
      >
        <span style={{ color: "var(--accent)" }}>[</span>
        AlgoHaven
        <span style={{ color: "var(--accent)" }}>]</span>
      </Link>

      {/* Links */}
      <ul className="hidden md:flex gap-8 list-none">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 13,
                color: "var(--muted)",
                textDecoration: "none",
                transition: "color .15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
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
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              color: "var(--muted)",
              textDecoration: "none",
            }}
          >
            {user.username || user.email}
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              color: "var(--text)",
              background: "transparent",
              border: "1px solid var(--border)",
              padding: "8px 16px",
              borderRadius: 2,
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <Link
          href="/auth"
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            fontWeight: 700,
            background: "var(--accent)",
            color: "#0a0a0a",
            padding: "8px 20px",
            borderRadius: 2,
            textDecoration: "none",
            transition: "background .15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--accent-dim)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--accent)")
          }
        >
          Sign In
        </Link>
      )}
    </nav>
  );
}
