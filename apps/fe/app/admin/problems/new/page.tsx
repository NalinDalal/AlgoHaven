"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/problem/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: "1.75rem",
          color: "var(--text)",
          marginBottom: "2rem",
        }}
      >
        Create New Problem
      </h1>

      {error && (
        <div
          style={{
            background: "#2d0d0d",
            border: "1px solid #5c1a1a",
            color: "var(--red)",
            padding: "1rem",
            borderRadius: 4,
            marginBottom: "1.5rem",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "var(--accent)",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            Basic Information
          </h3>

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
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm({ ...form, difficulty: e.target.value })
                  }
                  style={{
                    width: "100%",
                    background: "var(--bg)",
                    border: "1px solid var(--border-lit)",
                    borderRadius: 2,
                    padding: "10px 12px",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 13,
                    color: "var(--text)",
                    outline: "none",
                  }}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
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
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. arrays, hashmap, dp"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statement */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "var(--accent)",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            Problem Statement (Markdown)
          </h3>

          <textarea
            value={form.statement}
            onChange={(e) => setForm({ ...form, statement: e.target.value })}
            placeholder="Write your problem statement in markdown..."
            required
            style={{
              ...inputStyle,
              minHeight: 250,
              resize: "vertical",
              fontFamily: "var(--font-mono), monospace",
            }}
          />
        </div>

        {/* Limits */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "var(--accent)",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            Limits & Visibility
          </h3>

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
        </div>

        {/* Test Cases */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 12,
                color: "var(--accent)",
                letterSpacing: ".1em",
                textTransform: "uppercase",
              }}
            >
              Test Cases
            </h3>
            <button
              type="button"
              onClick={addTestCase}
              style={{
                background: "transparent",
                border: "1px solid var(--border-lit)",
                borderRadius: 2,
                padding: "6px 12px",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 12,
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              + Add Test Case
            </button>
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
                      <button
                        type="button"
                        onClick={() => removeTestCase(tc.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--red)",
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
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
                    <textarea
                      value={tc.input}
                      onChange={(e) =>
                        updateTestCase(tc.id, "input", e.target.value)
                      }
                      placeholder="Input data..."
                      style={{ ...inputStyle, minHeight: 80 }}
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
                    <textarea
                      value={tc.expectedOutput}
                      onChange={(e) =>
                        updateTestCase(tc.id, "expectedOutput", e.target.value)
                      }
                      placeholder="Expected output..."
                      style={{ ...inputStyle, minHeight: 80 }}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div
          style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
        >
          <button
            type="button"
            onClick={() => router.push("/admin")}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 2,
              padding: "12px 24px",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: 2,
              padding: "12px 32px",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              fontWeight: 700,
              color: "#000",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating..." : "Create Problem"}
          </button>
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border-lit)",
  borderRadius: 2,
  padding: "10px 12px",
  fontFamily: "var(--font-mono), monospace",
  fontSize: 13,
  color: "var(--text)",
  outline: "none",
  transition: "border-color .15s",
};
