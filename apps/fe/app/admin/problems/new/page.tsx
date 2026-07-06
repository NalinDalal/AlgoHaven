"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, ErrorBanner, Card, SectionHeading } from "@repo/ui";
import { apiFetch } from "@/lib/apiFetch";

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
}

export default function NewProblemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    difficulty: "MEDIUM",
    statement: "",
    tags: "",
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    isPublic: false,
  });

  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: "1", input: "", expectedOutput: "", isSample: true },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/problem/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-By": "AlgoHaven" },
          credentials: "include",
          body: JSON.stringify({
            ...form,
            tags: form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            testCases: testCases.map((tc) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isSample: tc.isSample,
            })),
          }),
        },
      );

      const data = await response.json();

      if (data.status === "success") {
        router.push("/admin");
      } else {
        setError(data.message || "Failed to create problem");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-[900px] mx-auto p-8">
      <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[1.75rem] text-[var(--text)] mb-8">
        Create New Problem
      </h1>

      {error && (
        <ErrorBanner className="mb-6">
          {error}
        </ErrorBanner>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <SectionHeading>Basic Information</SectionHeading>

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
                <Select value={form.difficulty} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, difficulty: e.target.value })}>
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
          <SectionHeading>Problem Statement (Markdown)</SectionHeading>

          <Textarea
            value={form.statement}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, statement: e.target.value })}
            placeholder="Write your problem statement in markdown..."
            required
            className="min-h-[250px]"
          />
        </Card>

        <Card>
          <SectionHeading>Limits & Visibility</SectionHeading>

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

        <div className="flex gap-4 justify-end">
          <Button variant="secondary" type="button" onClick={() => router.push("/admin")}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? "Creating..." : "Create Problem"}
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
