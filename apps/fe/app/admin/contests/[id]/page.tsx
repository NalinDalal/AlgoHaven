"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Contest {
    id: string;
    title: string;
    slug: string;
    startTime: string;
    endTime: string;
    freezeTime: string | null;
    visibility: "PUBLIC" | "INVITE" | "PRIVATE";
    isRated: boolean;
    isPractice: boolean;
    registrationOpen: boolean;
}

export default function EditContestPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: "",
        slug: "",
        startTime: "",
        endTime: "",
        freezeTime: "",
        visibility: "PUBLIC",
        isRated: false,
        isPractice: false,
        registrationOpen: true,
    });

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${id}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success") {
                    const contest: Contest = data.data.contest;
                    const formatDateForInput = (dateStr: string) => {
                        const d = new Date(dateStr);
                        return d.toISOString().slice(0, 16);
                    };
                    setForm({
                        title: contest.title,
                        slug: contest.slug,
                        startTime: formatDateForInput(contest.startTime),
                        endTime: formatDateForInput(contest.endTime),
                        freezeTime: contest.freezeTime
                            ? formatDateForInput(contest.freezeTime)
                            : "",
                        visibility: contest.visibility,
                        isRated: contest.isRated,
                        isPractice: contest.isPractice,
                        registrationOpen: contest.registrationOpen,
                    });
                } else {
                    setError(data.message || "Failed to load contest");
                }
            })
            .catch((err) => {
                setError("Failed to load contest");
                console.error(err);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
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
                router.push("/admin/contests");
            } else {
                setError(data.message || "Failed to update contest");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setSaving(false);
        }
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
                Loading contest...
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "2rem",
                }}
            >
                <button
                    onClick={() => router.push("/admin/contests")}
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
                    Edit Contest
                </h1>
            </div>

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

                            <FormField
                                label="Freeze Time (optional)"
                                type="datetime-local"
                                value={form.freezeTime}
                                onChange={(v) => setForm({ ...form, freezeTime: v })}
                            />

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
                        onClick={() => router.push("/admin/contests")}
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
