"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Input, Select, Textarea, ErrorBanner, Card, SectionHeading } from "@repo/ui";

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
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`, {
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
      const response = await fetch(
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

  if (loading) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "var(--muted)",
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        Loading problem...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <button
          onClick={() => router.push("/admin/problems")}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 2,
            padding: "8px 12px",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            color: "var(--muted)",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <h1
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: "1.75rem",
            color: "var(--text)",
            margin: 0,
          }}
        >
          Edit Problem
        </h1>
      </div>

      {error && (
        <ErrorBanner style={{ marginBottom: "1.5rem" }}>
          {error}
        </ErrorBanner>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <SectionHeading>
            Basic Information
          </SectionHeading>

          <div style={{ display: "grid", gap: "1rem" }}>
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    color: "var(--muted)",
                    marginBottom: "0.5rem",
                  }}
                >
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
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    color: "var(--muted)",
                    marginBottom: "0.5rem",
                  }}
                >
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
            textareaStyle={{
              minHeight: 250,
              fontFamily: "var(--font-mono), monospace",
            }}
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
            textareaStyle={{
              minHeight: 150,
              fontFamily: "var(--font-mono), monospace",
            }}
          />
        </Card>

        <Card>
          <SectionHeading>
            Limits & Visibility
          </SectionHeading>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1rem",
            }}
          >
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
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: "0.5rem",
                }}
              >
                Visibility
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) =>
                    setForm({ ...form, isPublic: e.target.checked })
                  }
                  style={{ width: 16, height: 16 }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 13,
                  }}
                >
                  Public
                </span>
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <SectionHeading style={{ marginBottom: 0 }}>
              Test Cases
            </SectionHeading>
            <Button variant="secondary" type="button" onClick={addTestCase} style={{ padding: "6px 12px", fontSize: 12, fontWeight: 400 }}>
              + Add Test Case
            </Button>
          </div>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            {testCases.map((tc, idx) => (
              <div
                key={tc.id}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    Test Case #{idx + 1}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={tc.isSample}
                        onChange={(e) =>
                          updateTestCase(tc.id, "isSample", e.target.checked)
                        }
                        style={{ width: 14, height: 14 }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 11,
                          color: "var(--muted)",
                        }}
                      >
                        Sample
                      </span>
                    </label>
                    {testCases.length > 1 && (
                      <Button variant="ghost" type="button" onClick={() => removeTestCase(tc.id)} style={{ color: "var(--red)", fontSize: 12, fontWeight: 400 }}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Input
                    </label>
                    <Textarea
                      value={tc.input}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateTestCase(tc.id, "input", e.target.value)
                      }
                      placeholder="Input data..."
                      textareaStyle={{ minHeight: 80 }}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Expected Output
                    </label>
                    <Textarea
                      value={tc.expectedOutput}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateTestCase(tc.id, "expectedOutput", e.target.value)
                      }
                      placeholder="Expected output..."
                      textareaStyle={{ minHeight: 80 }}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div
          style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
        >
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
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "var(--muted)",
          marginBottom: "0.5rem",
        }}
      >
        {label} {required && <span style={{ color: "var(--red)" }}>*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
      {hint && (
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: "var(--muted)",
            marginTop: "0.25rem",
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  cursor: "pointer",
};
