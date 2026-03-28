"use client";

/**
 * Problem Editor Page
 *
 * This page allows admin users to edit existing problems.
 * It fetches the current problem data and provides a form to modify:
 * - Basic information (title, slug, difficulty, tags)
 * - Problem statement and editorial (markdown)
 * - Time and memory limits
 * - Visibility settings
 * - Test cases
 *
 * Route: /admin/problems/[id]
 */

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Interface representing a test case for a problem
 * Test cases define inputs and expected outputs for judging solutions
 */
interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
}

/**
 * Interface representing the full problem data structure
 * Includes all editable fields from the backend
 */
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

/**
 * Main Edit Problem Page Component
 *
 * Handles loading problem data on mount and saving changes.
 * Uses React state to manage form inputs and test cases.
 *
 * @returns JSX element representing the edit problem form
 */
export default function EditProblemPage() {
  // Next.js navigation and routing hooks
  const router = useRouter();
  const params = useParams();

  // Extract the problem ID from URL parameters
  const id = params.id as string;

  // UI state management
  const [loading, setLoading] = useState(true); // Initial data loading state
  const [saving, setSaving] = useState(false); // Form submission state
  const [error, setError] = useState<string | null>(null); // Error message state

  /**
   * Form state for problem fields
   * mirrors the Problem interface but with tags as comma-separated string
   */
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

  /**
   * Test cases state
   * Array of test case objects for the problem
   * Initialized with one empty sample test case
   */
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: "1", input: "", expectedOutput: "", isSample: true },
  ]);

  /**
   * Effect hook to fetch problem data on component mount
   * Loads all problem fields including admin-only data
   */
  useEffect(() => {
    // Fetch problem details from the API
    // Includes all fields since we're in admin section
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`, {
      credentials: "include", // Include cookies for authentication
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          // Populate form with fetched problem data
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

          // Populate test cases if available
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
          // Handle API error response
          setError(data.message || "Failed to load problem");
        }
      })
      .catch((err) => {
        // Handle network/connection errors
        setError("Failed to load problem");
        console.error(err);
      })
      .finally(() => {
        // Stop loading spinner regardless of success/failure
        setLoading(false);
      });
  }, [id]); // Re-run only if problem ID changes

  /**
   * Handles form submission
   * Sends PUT request to update the problem with new data
   *
   * @param e - React form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    setSaving(true); // Show saving indicator
    setError(null); // Clear any previous errors

    try {
      // Send PUT request to update problem
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Include authentication cookies
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
        // Redirect to problems list on success
        router.push("/admin/problems");
      } else {
        // Display API error message
        setError(data.message || "Failed to update problem");
      }
    } catch (err) {
      // Handle network errors
      setError("Network error");
    } finally {
      // Stop saving indicator
      setSaving(false);
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

  /**
   * Loading state rendering
   * Shows while fetching problem data
   */
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
      {/* Header with back button */}
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

      {/* Error display */}
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

      {/* Main form */}
      <form onSubmit={handleSubmit}>
        {/* Basic Information Section */}
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

            {/* Difficulty and Tags in same row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {/* Difficulty dropdown */}
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

              {/* Tags input */}
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

        {/* Problem Statement Section */}
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

        {/* Editorial Section (Optional) */}
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
            Editorial (Optional)
          </h3>

          <textarea
            value={form.editorial}
            onChange={(e) => setForm({ ...form, editorial: e.target.value })}
            placeholder="Write your editorial in markdown..."
            style={{
              ...inputStyle,
              minHeight: 150,
              resize: "vertical",
              fontFamily: "var(--font-mono), monospace",
            }}
          />
        </div>

        {/* Limits & Visibility Section */}
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

            {/* Visibility checkbox */}
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

        {/* Test Cases Section */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Section header with add button */}
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

          {/* Test case cards */}
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
                {/* Test case header with controls */}
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
                    {/* Sample checkbox */}
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
                    {/* Remove button - hidden if only one test case */}
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

                {/* Input and Expected Output fields */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  {/* Input field */}
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
                  {/* Expected Output field */}
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

        {/* Form action buttons */}
        <div
          style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
        >
          {/* Cancel button - returns to problems list */}
          <button
            type="button"
            onClick={() => router.push("/admin/problems")}
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
          {/* Submit button */}
          <button
            type="submit"
            disabled={saving}
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: 2,
              padding: "12px 32px",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              fontWeight: 700,
              color: "#000",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
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

/**
 * Shared input styling
 * Used by both the FormField component and textarea elements
 */
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
