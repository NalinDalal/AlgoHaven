'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
    fetch(`/api/auth/verify?token=${token}`)
      .then(async res => {
        if (res.ok) {
          // On success, redirect to dashboard or home
          router.replace("/dashboard");
        } else {
          const data = await res.json();
          router.replace(`/login?error=${encodeURIComponent(data.error || "invalid_token")}`);
        }
      });
  }, [router]);

  return <div>Verifying magic link...</div>;
}
