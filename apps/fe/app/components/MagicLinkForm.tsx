import { useState } from "react";

// Use your backend URL here
const BACKEND_URL = process.env.NEXT_PUBLIC_BE_URL || "http://localhost:3001";

export function MagicLinkForm({ onSent }: { onSent?: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/request-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("sent");
        onSent?.();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setStatus("error");
      }
    } catch (err) {
      setError("Network error");
      setStatus("error");
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Enter your email"
        className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        disabled={status === "loading"}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Sending..." : "Get Magic Link"}
      </button>
      {error && <div className="text-red-600 text-center text-sm">{error}</div>}
      {status === "sent" && (
        <div className="text-green-600 text-center font-medium">
          Magic link sent! Check your email to sign in.
        </div>
      )}
    </form>
  );
}
