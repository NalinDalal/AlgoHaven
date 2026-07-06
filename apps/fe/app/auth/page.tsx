"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import Link from "next/link";
import { Button, Input, ErrorBanner } from "@repo/ui";

type Mode = "login" | "register";

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const endpoint =
            mode === "login"
                ? `${process.env.NEXT_PUBLIC_BE_URL}/api/auth/login`
                : `${process.env.NEXT_PUBLIC_BE_URL}/api/auth/register`;

        const body: Record<string, string> = { email, password };
        if (mode === "register") {
            body.username = username;
        }

        try {
            const res = await apiFetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });

            if (res.ok) {
                router.push("/");
                router.refresh();
            } else {
                const data = await res.json();
                setMessage(data.message || "Authentication failed");
            }
        } catch (err) {
            setMessage("Network error");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] font-[family-name:var(--font-mono)]">
            <div className="w-full max-w-[360px] p-8">
                <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-2xl text-[var(--text)] mb-2 text-center">
                    {mode === "login" ? "Sign In" : "Create Account"}
                </h1>

                <p className="text-[13px] text-[var(--muted)] text-center mb-8">
                    {mode === "login"
                        ? "Enter your credentials to sign in"
                        : "Create an account to get started"}
                </p>

                {message && (
                    <ErrorBanner className="mb-4">
                        {message}
                    </ErrorBanner>
                )}

                <form onSubmit={handleSubmit}>
                    {mode === "register" && (
                        <div className="mb-4">
                            <label className="block text-xs text-[var(--muted)] mb-2">
                                Username
                            </label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="your_username"
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-xs text-[var(--muted)] mb-2">
                            Email
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs text-[var(--muted)] mb-2">
                            Password
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                    >
                        {loading
                            ? "Please wait..."
                            : mode === "login"
                                ? "Sign In"
                                : "Create Account"}
                    </Button>
                </form>

                <p className="text-[13px] text-[var(--muted)] text-center mt-6">
                    {mode === "login" ? (
                        <>
                            Don't have an account?{" "}
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => {
                                    setMode("register");
                                    setMessage("");
                                }}
                            >
                                Sign up
                            </Button>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => {
                                    setMode("login");
                                    setMessage("");
                                }}
                            >
                                Sign in
                            </Button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
