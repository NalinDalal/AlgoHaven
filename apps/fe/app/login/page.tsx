"use client";
export default function LoginPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const error = searchParams?.error;
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg bg-white shadow">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      {error && (
        <div className="text-red-600 mb-4">
          {error === "network_error"
            ? "Network error: Could not reach authentication server."
            : error === "invalid_token"
            ? "Invalid or expired magic link."
            : error === "missing_token"
            ? "Missing magic link token."
            : error}
        </div>
      )}
      <p>Please try signing in again or request a new magic link.</p>
    </div>
  );
}
