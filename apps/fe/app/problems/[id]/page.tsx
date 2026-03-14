'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ProblemDetail {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  constraints: string;
  examples: { input: string; output: string }[];
  testCases: any[];
}

export default function ProblemDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`)
      .then(res => res.json())
      .then(data => {
        setProblem(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!problem) return <div>Problem not found.</div>;

  return (
    <div>
      <h1>{problem.title} ({problem.difficulty})</h1>
      <p>{problem.description}</p>
      <h3>Constraints</h3>
      <pre>{problem.constraints}</pre>
      <h3>Examples</h3>
      <ul>
        {problem.examples?.map((ex, i) => (
          <li key={i}>
            <strong>Input:</strong> <pre>{ex.input}</pre>
            <strong>Output:</strong> <pre>{ex.output}</pre>
          </li>
        ))}
      </ul>
      {/* Submission form will go here */}
    </div>
  );
}
