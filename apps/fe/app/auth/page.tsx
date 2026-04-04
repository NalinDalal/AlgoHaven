"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        ? "http://localhost:3001/api/auth/login"
        : "http://localhost:3001/api/auth/register";

    const body: Record<string, string> = { email, password };
    if (mode === "register") {
      body.username = username;
    }

    try {
      const res = await fetch(endpoint, {
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
          <div
            style={{
              background: "#2d0d0d",
              border: "1px solid #5c1a1a",
              color: "var(--red)",
              padding: "0.75rem",
              borderRadius: 4,
              marginBottom: "1rem",
              fontSize: 13,
            }}
          >
            {message}
          </div>
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
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                style={inputStyle}
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
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "var(--accent)",
              border: "none",
              borderRadius: 2,
              padding: "12px",
              fontSize: 13,
              fontWeight: 700,
              color: "#000",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
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
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setMessage("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border-lit)",
  borderRadius: 2,
  padding: "10px 12px",
  fontSize: 13,
  color: "var(--text)",
  outline: "none",
};
