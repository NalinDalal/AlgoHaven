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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        fontFamily: "var(--font-mono), monospace",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          padding: "2rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: "1.5rem",
            color: "var(--text)",
            marginBottom: "0.5rem",
            textAlign: "center",
          }}
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "var(--muted)",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          {mode === "login"
            ? "Enter your credentials to sign in"
            : "Create an account to get started"}
        </p>

        {message && (
          <ErrorBanner style={{ marginBottom: "1rem" }}>
            {message}
          </ErrorBanner>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: "0.5rem",
                }}
              >
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

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                color: "var(--muted)",
                marginBottom: "0.5rem",
              }}
            >
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

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                color: "var(--muted)",
                marginBottom: "0.5rem",
              }}
            >
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

        <p
          style={{
            fontSize: 13,
            color: "var(--muted)",
            textAlign: "center",
            marginTop: "1.5rem",
          }}
        >
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
