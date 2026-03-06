"use client";
import { useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BE_URL || "http://localhost:3001";

export default function MePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: "include",
    })
      .then(async res => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          const data = await res.json();
          setError(data.error || "Unauthorized");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error");
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></span>
      <span className="ml-4 text-lg text-gray-600">Loading...</span>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-red-100 text-red-700 px-6 py-4 rounded shadow text-lg">{error}</div>
    </div>
  );
  if (user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-green-100 text-green-700 px-6 py-4 rounded shadow text-lg">
        Welcome, {user.email}!
      </div>
    </div>
  );
}
