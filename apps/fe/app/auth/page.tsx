'use client';
import React, { useState } from 'react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    // Use backend URL from env variable
    const res = await fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setMessage('Check your email for the magic link!');
    } else {
      setMessage('Failed to send magic link.');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
