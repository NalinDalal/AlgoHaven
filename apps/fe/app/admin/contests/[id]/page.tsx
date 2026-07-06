"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Input, Select, ErrorBanner, Card, SectionHeading } from "@repo/ui";
import { apiFetch } from "@/lib/apiFetch";

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
        apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${id}`, {
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
            const response = await apiFetch(
                `${process.env.NEXT_PUBLIC_BE_URL}/api/contest/${id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "X-Requested-By": "AlgoHaven" },
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
            <div className="p-12 text-center text-[var(--muted)] font-mono">
                Loading contest...
            </div>
        );
    }

    return (
        <div className="max-w-[800px] mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="secondary" onClick={() => router.push("/admin/contests")}>
                    ← Back
                </Button>
                <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[1.75rem] text-[var(--text)] m-0">
                    Edit Contest
                </h1>
            </div>

            {error && (
                <ErrorBanner className="mb-6">
                    {error}
                </ErrorBanner>
            )}

            <form onSubmit={handleSubmit}>
                <Card>
                    <SectionHeading>Contest Details</SectionHeading>

                    <div className="grid gap-4">
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

                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block font-mono text-xs text-[var(--muted)] mb-2">
                                    Visibility
                                </label>
                                <Select value={form.visibility} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, visibility: e.target.value })}>
                                    <option value="PUBLIC">Public</option>
                                    <option value="INVITE">Invite Only</option>
                                    <option value="PRIVATE">Private</option>
                                </Select>
                            </div>

                            <FormField
                                label="Freeze Time (optional)"
                                type="datetime-local"
                                value={form.freezeTime}
                                onChange={(v) => setForm({ ...form, freezeTime: v })}
                            />

                            <div className="flex flex-col gap-3">
                                <label className="flex items-center gap-2 font-mono text-[13px] text-[var(--text)] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isRated}
                                        onChange={(e) =>
                                            setForm({ ...form, isRated: e.target.checked })
                                        }
                                    />
                                    Rated
                                </label>
                                <label className="flex items-center gap-2 font-mono text-[13px] text-[var(--text)] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isPractice}
                                        onChange={(e) =>
                                            setForm({ ...form, isPractice: e.target.checked })
                                        }
                                    />
                                    Practice Mode
                                </label>
                                <label className="flex items-center gap-2 font-mono text-[13px] text-[var(--text)] cursor-pointer">
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
                </Card>

                <div className="flex gap-4 justify-end">
                    <Button variant="secondary" type="button" onClick={() => router.push("/admin/contests")}>
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
        </div>
    );
}
