"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

const CENTERED_SCREEN_CLASS =
    "min-h-screen bg-[var(--bg)] flex items-center justify-center font-[family-name:var(--font-mono)] text-[var(--muted)]";

function DevLoginContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "admin@test.com";
    const secret = searchParams.get("secret") || "";
    useEffect(() => {
        apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/dev-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, secret }),
        }).then(() => {
            window.location.href = "/admin";
        });
    }, [email, secret]);
    return (
        <div className={CENTERED_SCREEN_CLASS}>
            Logging in as {email}...
        </div>
    );
}

export default function DevLoginPage() {
    return (
        <Suspense
            fallback={<div className={CENTERED_SCREEN_CLASS}>Loading...</div>}
        >
            <DevLoginContent />
        </Suspense>
    );
}
