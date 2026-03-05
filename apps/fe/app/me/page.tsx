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
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-xl">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome,</h1>
            <p className="text-gray-700 text-lg">{user?.email}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800">
          <span className="font-semibold text-gray-500">Email:</span>
          <span className="ml-2 text-gray-900">{user?.email}</span>
        </div>
      </div>
    </div>
  );
}
