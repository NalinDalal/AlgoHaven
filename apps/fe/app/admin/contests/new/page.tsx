"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewContestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    startTime: "",
    endTime: "",
    visibility: "PUBLIC",
    isRated: false,
    freezeTime: "",
    isPractice: false,
    registrationOpen: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/contest/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            startTime: new Date(form.startTime).toISOString(),
            endTime: new Date(form.endTime).toISOString(),
            freezeTime: form.freezeTime
              ? new Date(form.freezeTime).toISOString()
              : null,
          }),
        },
      );

      const data = await response.json();

      if (data.status === "success") {
        router.push("/admin");
      } else {
        setError(data.message || "Failed to create contest");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: "1.75rem",
          color: "var(--text)",
          marginBottom: "2rem",
        }}
      >
        Create New Contest
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
            Contest Details
          </h3>

          <div style={{ display: "grid", gap: "1rem" }}>
            <FormField
              label="Title"
              value={form.title}
              onChange={(v) => setForm({ ...form, title: v })}
              placeholder="e.g. AlgoHaven Weekly #1"
              required
            />

            <FormField
              label="Slug"
              value={form.slug}
              onChange={(v) => setForm({ ...form, slug: v })}
              placeholder="e.g. algohaven-weekly-1"
              required
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <FormField
                label="Start Time"
                type="datetime-local"
                value={form.startTime}
                onChange={(v) => setForm({ ...form, startTime: v })}
                required
              />
              <FormField
                label="End Time"
                type="datetime-local"
                value={form.endTime}
                onChange={(v) => setForm({ ...form, endTime: v })}
                required
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
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
                  Visibility
                </label>
                <select
                  value={form.visibility}
                  onChange={(e) =>
                    setForm({ ...form, visibility: e.target.value })
                  }
                  style={selectStyle}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="INVITE">Invite Only</option>
                  <option value="PRIVATE">Private</option>
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
                  Freeze Time (optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.freezeTime}
                  onChange={(e) =>
                    setForm({ ...form, freezeTime: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <label style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.isRated}
                    onChange={(e) =>
                      setForm({ ...form, isRated: e.target.checked })
                    }
                  />
                  Rated
                </label>
                <label style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.isPractice}
                    onChange={(e) =>
                      setForm({ ...form, isPractice: e.target.checked })
                    }
                  />
                  Practice Mode
                </label>
                <label style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.registrationOpen}
                    onChange={(e) =>
                      setForm({ ...form, registrationOpen: e.target.checked })
                    }
                  />
                  Registration Open
                </label>
              </div>
            </div>
          </div>
        </div>

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
            {loading ? "Creating..." : "Create Contest"}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
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
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontFamily: "var(--font-mono), monospace",
  fontSize: 13,
  color: "var(--text)",
  cursor: "pointer",
};
