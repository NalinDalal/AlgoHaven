"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, ErrorBanner, Card, SectionHeading } from "@repo/ui";
import { apiFetch } from "@/lib/apiFetch";

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
      const response = await apiFetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/contest/create`,
        {
          method: "POST",
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
    <div className="max-w-[800px] mx-auto p-8">
      <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[1.75rem] text-[var(--text)] mb-8">
        Create New Contest
      </h1>

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
                <Select
                  value={form.visibility}
                  onChange={(e) =>
                    setForm({ ...form, visibility: e.target.value })
                  }
                >
                  <option value="PUBLIC">Public</option>
                  <option value="INVITE">Invite Only</option>
                  <option value="PRIVATE">Private</option>
                </Select>
              </div>

              <div>
                <label className="block font-mono text-xs text-[var(--muted)] mb-2">
                  Freeze Time (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={form.freezeTime}
                  onChange={(e) =>
                    setForm({ ...form, freezeTime: e.target.value })
                  }
                />
              </div>

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
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/admin")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {loading ? "Creating..." : "Create Contest"}
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
