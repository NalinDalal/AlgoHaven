'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  slug: string;
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/problems?start=0&end=20`)
      .then(res => res.json())
      .then(data => {
        setProblems(data.problems || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Problems</h1>
      <ul>
        {problems.map(problem => (
          <li key={problem.id}>
            <Link href={`/problems/${problem.id}`}>{problem.title} ({problem.difficulty})</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
