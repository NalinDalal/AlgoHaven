'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BE_URL || "http://localhost:3001";

export default function VerifyPage() {
  const router = useRouter();

  useEffect(() => {
    // Extract token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      router.replace("/login?error=missing_token");
      return;
    }
    // Call backend to verify token
    fetch(`${BACKEND_URL}/api/auth/verify?token=${token}`)
      .then(async res => {
        if (res.ok) {
          // On success, redirect to /me to show user info
          router.replace("/me");
        } else {
          const data = await res.json();
          router.replace(`/login?error=${encodeURIComponent(data.error || "invalid_token")}`);
        }
      })
      .catch(() => {
        router.replace("/login?error=network_error");
      });
  }, [router]);

  return <div>Verifying magic link...</div>;
}
