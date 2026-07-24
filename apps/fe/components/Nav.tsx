"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";

const navLinks = [
    { href: "/problems", label: "Problems" },
    { href: "/contests", label: "Contests" },
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
            .catch(() => { })
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
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 h-16 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
            {/* Logo */}
            <Link
                href="/"
                className="flex items-center gap-1.5 font-mono text-[15px] font-bold text-zinc-100 no-underline"
            >
                <span className="text-emerald-400">[</span>
                AlgoHaven
                <span className="text-emerald-400">]</span>
            </Link>

            {/* Links */}
            <ul className="hidden md:flex gap-8 list-none">
                {navLinks.map((link) => (
                    <li key={link.href}>
                        <Link
                            href={link.href}
                            className="font-mono text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>

            {/* CTA */}
            {loading ? (
                <div className="w-20 h-8" /> // Placeholder to prevent layout shift
            ) : user ? (
                <div className="flex items-center gap-4">
                    <Link
                        href="/me"
                        className="font-mono text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        {user.username || user.email}
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="font-mono text-sm text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-4 py-1.5 rounded-md transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            ) : (
                <Link
                    href="/auth"
                    className="font-mono text-sm font-bold bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-black px-5 py-2 rounded-md transition-colors"
                >
                    Sign In
                </Link>
            )}
        </nav>
    );
}
