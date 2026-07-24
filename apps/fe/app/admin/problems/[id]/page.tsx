"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Input, Select, Textarea, ErrorBanner, Card, SectionHeading } from "@repo/ui";
import { apiFetch } from "@/lib/apiFetch";

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
}

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  statement: string;
  editorial?: string;
  tags: string[];
  timeLimitMs: number;
  memoryLimitKb: number;
  isPublic: boolean;
  hasCustomChecker: boolean;
  checkerCode?: string;
  testCases: TestCase[];
}

export default function EditProblemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejudging, setRejudging] = useState(false);
  const [rejudgeResult, setRejudgeResult] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    difficulty: "MEDIUM",
    statement: "",
    editorial: "",
    tags: "",
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    isPublic: false,
    hasCustomChecker: false,
    checkerCode: "",
  });

  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: "1", input: "", expectedOutput: "", isSample: true },
  ]);

  useEffect(() => {
    apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const problem: Problem = data.data;
          setForm({
            title: problem.title,
            slug: problem.slug,
            difficulty: problem.difficulty,
            statement: problem.statement,
            editorial: problem.editorial || "",
            tags: problem.tags?.join(", ") || "",
            timeLimitMs: problem.timeLimitMs,
            memoryLimitKb: problem.memoryLimitKb,
            isPublic: problem.isPublic,
            hasCustomChecker: problem.hasCustomChecker || false,
            checkerCode: problem.checkerCode || "",
          });

          if (problem.testCases && problem.testCases.length > 0) {
            setTestCases(
              problem.testCases.map((tc) => ({
                id: tc.id || Date.now().toString(),
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isSample: tc.isSample,
              })),
            );
          }
        } else {
          setError(data.message || "Failed to load problem");
        }
      })
      .catch((err) => {
        setError("Failed to load problem");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await apiFetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Requested-By": "AlgoHaven" },
          credentials: "include",
          body: JSON.stringify({
            ...form,
            tags: form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            testCases: testCases.map((tc) => ({
              id: tc.id,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isSample: tc.isSample,
            })),
          }),
        },
      );

      const data = await response.json();

      if (data.status === "success") {
        router.push("/admin/problems");
      } else {
        setError(data.message || "Failed to update problem");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      {
        id: Date.now().toString(),
        input: "",
        expectedOutput: "",
        isSample: false,
      },
    ]);
  };

  const removeTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((tc) => tc.id !== id));
    }
  };

  const updateTestCase = (
    id: string,
    field: keyof TestCase,
    value: string | boolean,
  ) => {
    setTestCases(
      testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc)),
    );
  };

  const handleBulkRejudge = async () => {
    if (!confirm("Rejudge all submissions for this problem? This cannot be undone.")) return;
    setRejudging(true);
    setRejudgeResult(null);
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/admin/problems/${id}/rejudge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-By": "AlgoHaven" },
          credentials: "include",
          body: JSON.stringify({}),
        },
      );
      const data = await res.json();
      if (data.status === "success") {
        setRejudgeResult(`Rejudge started: ${data.data.totalCount} submissions queued`);
      } else {
        setRejudgeResult(data.message || "Failed to start rejudge");
      }
    } catch (err) {
      setRejudgeResult("Network error");
    } finally {
      setRejudging(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[var(--muted)] font-mono">
        Loading problem...
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/admin/problems")}
          className="bg-transparent border border-[var(--border)] rounded-sm px-3 py-2 font-mono text-xs text-[var(--muted)] cursor-pointer"
        >
          ← Back
        </button>
        <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[1.75rem] text-[var(--text)] m-0">
          Edit Problem
        </h1>
      </div>

      {error && (
        <ErrorBanner className="mb-6">
          {error}
        </ErrorBanner>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <SectionHeading>
            Basic Information
          </SectionHeading>

          <div className="grid gap-4">
            <FormField
              label="Title"
              value={form.title}
              onChange={(v) => setForm({ ...form, title: v })}
              placeholder="e.g. Two Sum"
              required
            />

            <FormField
              label="Slug"
              value={form.slug}
              onChange={(v) => setForm({ ...form, slug: v })}
              placeholder="e.g. two-sum"
              required
              hint="URL-friendly identifier"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-[var(--muted)] mb-2">
                  Difficulty
                </label>
                <Select
                  value={form.difficulty}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setForm({ ...form, difficulty: e.target.value })
                  }
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </Select>
              </div>

              <div>
                <label className="block font-mono text-xs text-[var(--muted)] mb-2">
                  Tags (comma separated)
                </label>
                <Input
                  type="text"
                  value={form.tags}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. arrays, hashmap, dp"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeading>
            Problem Statement (Markdown)
          </SectionHeading>

          <Textarea
            value={form.statement}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, statement: e.target.value })}
            placeholder="Write your problem statement in markdown..."
            required
            className="min-h-[250px] font-mono"
          />
        </Card>

        <Card>
          <SectionHeading>
            Editorial (Optional)
          </SectionHeading>

          <Textarea
            value={form.editorial}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, editorial: e.target.value })}
            placeholder="Write your editorial in markdown..."
            className="min-h-[150px] font-mono"
          />
        </Card>

        <Card>
          <SectionHeading>
            Limits & Visibility
          </SectionHeading>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Time Limit (ms)"
              type="number"
              value={form.timeLimitMs.toString()}
              onChange={(v) =>
                setForm({ ...form, timeLimitMs: parseInt(v) || 2000 })
              }
            />

            <FormField
              label="Memory Limit (KB)"
              type="number"
              value={form.memoryLimitKb.toString()}
              onChange={(v) =>
                setForm({ ...form, memoryLimitKb: parseInt(v) || 262144 })
              }
            />

            <div>
              <label className="block font-mono text-xs text-[var(--muted)] mb-2">
                Visibility
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) =>
                    setForm({ ...form, isPublic: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="font-mono text-[13px]">
                  Public
                </span>
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeading>
            Custom Checker (Optional)
          </SectionHeading>

          <div className="grid gap-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasCustomChecker}
                  onChange={(e) =>
                    setForm({ ...form, hasCustomChecker: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="font-mono text-[13px]">
                  Enable custom checker
                </span>
              </label>
              <span className="block font-mono text-[11px] text-[var(--muted)] mt-1">
                Use this for problems with multiple valid outputs. The checker receives input, actual output, and expected output on stdin. Exit 0 for accepted, non-zero for rejected.
              </span>
            </div>

            {form.hasCustomChecker && (
              <div>
                <label className="block font-mono text-xs text-[var(--muted)] mb-2">
                  Checker Code (Python) <span className="text-[var(--red)]">*</span>
                </label>
                <Textarea
                  value={form.checkerCode}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setForm({ ...form, checkerCode: e.target.value })
                  }
                  placeholder={`import sys

input_data = sys.stdin.readline().strip()
actual_output = sys.stdin.readline().strip()
expected_output = sys.stdin.readline().strip()

# Your comparison logic here
if actual_output == expected_output:
    sys.exit(0)  # Accepted
else:
    sys.exit(1)  # Rejected`}
                  className="min-h-[200px] font-mono"
                  required
                />
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <SectionHeading className="mb-0">
              Test Cases
            </SectionHeading>
            <Button variant="secondary" type="button" onClick={addTestCase} className="px-3 py-1.5 text-xs font-normal">
              + Add Test Case
            </Button>
          </div>

          <div className="grid gap-6">
            {testCases.map((tc, idx) => (
              <div
                key={tc.id}
                className="bg-[var(--bg)] border border-[var(--border)] rounded p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono text-xs text-[var(--muted)]">
                    Test Case #{idx + 1}
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tc.isSample}
                        onChange={(e) =>
                          updateTestCase(tc.id, "isSample", e.target.checked)
                        }
                        className="w-3.5 h-3.5"
                      />
                      <span className="font-mono text-[11px] text-[var(--muted)]">
                        Sample
                      </span>
                    </label>
                    {testCases.length > 1 && (
                      <Button variant="ghost" type="button" onClick={() => removeTestCase(tc.id)} className="text-[var(--red)] text-xs font-normal">
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] text-[var(--muted)] mb-2">
                      Input
                    </label>
                    <Textarea
                      value={tc.input}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateTestCase(tc.id, "input", e.target.value)
                      }
                      placeholder="Input data..."
                      className="min-h-[80px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-[var(--muted)] mb-2">
                      Expected Output
                    </label>
                    <Textarea
                      value={tc.expectedOutput}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateTestCase(tc.id, "expectedOutput", e.target.value)
                      }
                      placeholder="Expected output..."
                      className="min-h-[80px]"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading>
            Bulk Rejudge
          </SectionHeading>

          <div className="grid gap-4">
            <p className="font-mono text-[13px] text-[var(--muted)]">
              Rejudge all submissions for this problem. This will reset each submission to QUEUED and resend it to the worker.
            </p>

            {rejudgeResult && (
              <div className={`font-mono text-[13px] p-3 rounded-sm border ${
                rejudgeResult.includes("started")
                  ? "text-[#4ade80] bg-[#0d2e16] border-[#1a5c2d]"
                  : "text-[#ff4d4d] bg-[#2d0d0d] border-[#5c1a1a]"
              }`}>
                {rejudgeResult}
              </div>
            )}

            <div>
              <Button
                variant="secondary"
                type="button"
                onClick={handleBulkRejudge}
                disabled={rejudging}
                className="text-[var(--accent)] border-[var(--accent)]"
              >
                {rejudging ? "Starting rejudge..." : "Rejudge All Submissions"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button variant="secondary" type="button" onClick={() => router.push("/admin/problems")}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block font-mono text-xs text-[var(--muted)] mb-2">
        {label} {required && <span className="text-[var(--red)]">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
      {hint && (
        <span className="block font-mono text-[11px] text-[var(--muted)] mt-1">
          {hint}
        </span>
      )}
    </div>
  );
}
