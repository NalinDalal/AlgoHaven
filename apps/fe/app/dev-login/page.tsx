"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function DevLoginPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "admin@test.com";

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/dev-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then(() => {
      window.location.href = "/admin";
    });
  }, [email]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono), monospace",
        color: "var(--muted)",
      }}
    >
      Logging in as {email}...
    </div>
  );
}
