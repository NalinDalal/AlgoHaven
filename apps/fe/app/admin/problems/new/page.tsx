"use client";

/**
 * New Problem Creation Page
 *
 * Provides a form for admin users to create new problems.
 * Includes fields for:
 * - Basic information (title, slug, difficulty, tags)
 * - Problem statement and editorial (markdown)
 * - Time and memory limits
 * - Visibility settings
 * - Test cases (input/output pairs)
 *
 * Route: /admin/problems/new
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, ErrorBanner, Card, SectionHeading } from "@repo/ui";
import { apiFetch } from "@/lib/apiFetch";

/**
 * Interface representing a test case
 * Test cases define inputs and expected outputs for judging solutions
 */
interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
}

/**
 * Main New Problem Page Component
 *
 * Renders a form for creating new problems.
 * Handles form submission to create problem via API.
 *
 * @returns JSX element with problem creation form
 */
export default function NewProblemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Form submission state
  const [error, setError] = useState<string | null>(null); // Error message state

  /**
   * Form state for problem fields
   * Stores all basic problem information
   * Tags are stored as comma-separated string (converted to array on submit)
   */
  const [form, setForm] = useState({
    title: "",
    slug: "",
    difficulty: "MEDIUM", // Default difficulty
    statement: "",
    tags: "",
    timeLimitMs: 2000, // Default: 2 seconds
    memoryLimitKb: 262144, // Default: 256 MB
    isPublic: false, // Default: private
  });

  /**
   * Test cases state
   * Initialized with one empty sample test case
   */
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: "1", input: "", expectedOutput: "", isSample: true },
  ]);

  /**
   * Handles form submission
   * Sends POST request to create a new problem
   *
   * @param e - React form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true); // Show loading indicator
    setError(null); // Clear previous errors

    try {
      const response = await apiFetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/problem/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-By": "AlgoHaven" },
          credentials: "include",
          body: JSON.stringify({
            // Spread form data
            ...form,
            // Convert comma-separated tags to array
            tags: form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            // Format test cases for API
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
        // Redirect to admin dashboard on success
        router.push("/admin");
      } else {
        // Display API error message
        setError(data.message || "Failed to create problem");
      }
    } catch (err) {
      // Handle network errors
      setError("Network error");
    } finally {
      // Stop loading indicator
      setLoading(false);
    }
  };

  /**
   * Adds a new empty test case to the form
   * Generates unique ID based on current timestamp
   */
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

  /**
   * Removes a test case from the form
   * Prevents removing the last remaining test case
   *
   * @param id - The ID of the test case to remove
   */
  const removeTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((tc) => tc.id !== id));
    }
  };

  /**
   * Updates a specific field of a test case
   *
   * @param id - The ID of the test case to update
   * @param field - The field name to update
   * @param value - The new value for the field
   */
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
        <ErrorBanner style={{ marginBottom: "1.5rem" }}>
          {error}
        </ErrorBanner>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Card>
          <SectionHeading>Basic Information</SectionHeading>

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
                <Select value={form.difficulty} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, difficulty: e.target.value })}>
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
        {/* Statement */}
        <Card>
          <SectionHeading>Problem Statement (Markdown)</SectionHeading>

          <Textarea
            value={form.statement}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, statement: e.target.value })}
            placeholder="Write your problem statement in markdown..."
            required
            textareaStyle={{ minHeight: 250 }}
          />
        </Card>

        {/* Limits */}
        <Card>
          <SectionHeading>Limits & Visibility</SectionHeading>

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

        {/* Test Cases */}
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <SectionHeading>Test Cases</SectionHeading>
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
                    <textarea
                      value={tc.input}
                      onChange={(e) =>
                        updateTestCase(tc.id, "input", e.target.value)
                      }
                      placeholder="Input data..."
                      style={{ minHeight: 80, width: "100%", background: "var(--bg)", border: "1px solid var(--border-lit)", borderRadius: 2, padding: "10px 12px", fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--text)", outline: "none", resize: "vertical" }}
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
                      style={{ minHeight: 80, width: "100%", background: "var(--bg)", border: "1px solid var(--border-lit)", borderRadius: 2, padding: "10px 12px", fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--text)", outline: "none", resize: "vertical" }}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        {/* Submit */}
        <div
          style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
        >
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

/**
 * Reusable form field component
 *
 * Renders a label, input field, and optional hint text.
 * Used throughout the form for consistent styling.
 *
 * @param props - Component props
 * @returns JSX element for the form field
 */
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
        {/* Display asterisk for required fields */}
        {label} {required && <span style={{ color: "var(--red)" }}>*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
      {/* Display hint text below field if provided */}
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

