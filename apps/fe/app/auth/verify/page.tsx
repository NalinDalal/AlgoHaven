"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      router.push("/auth");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/verify?token=${token}`, {
      method: "GET",
    }).then((res) => {
      if (res.ok) {
        // Get session cookie from response headers
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
          document.cookie = setCookie;
        }
        router.push("/admin");
      } else {
        router.push("/auth?error=invalid");
      }
    });
  }, [token, router]);

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
      Verifying your login...
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
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
          Loading...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
