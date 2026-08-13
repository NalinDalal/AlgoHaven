"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

interface PlagiarismReport {
  id: string;
  similarityScore: number;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
  submission: {
    id: string;
    language: string;
    createdAt: string;
    user: { id: string; username: string | null; email: string };
    problem: { id: string; title: string; slug: string };
  };
  matchedWithUser: { id: string; username: string | null; email: string } | null;
  reviewedBy: { id: string; username: string | null; email: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "text-[#ffd700] bg-[#1a1a0d] border-[#4a4a1a]",
  CONFIRMED: "text-[#ff4d4d] bg-[#2d0d0d] border-[#5c1a1a]",
  REJECTED: "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]",
};

const TH_CLASS =
  "px-4 py-2.5 text-left font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--muted)] uppercase tracking-[.06em] bg-[#0d0d0d]";
const TD_CLASS = "px-4 py-3 align-middle";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function userName(user: { username: string | null; email: string } | null) {
  if (!user) return "—";
  return user.username || user.email;
}

export default function PlagiarismPage() {
  const [reports, setReports] = useState<PlagiarismReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const limit = 20;

  const fetchReports = (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/admin/plagiarism?${params}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setReports(data.data.reports);
          if (data.data?.meta) {
            setTotalPages(data.data.meta.totalPages);
            setTotal(data.data.meta.total);
          }
        }
      })
      .catch(() => setNotice({ type: "err", text: "Failed to load reports" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports(page);
  }, [page]);

  const handleConfirm = async (reportId: string) => {
    setConfirmingId(reportId);
    setNotice(null);
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/plagiarism/${reportId}/confirm`,
        { method: "POST", credentials: "include" },
      );
      const d = await res.json();
      if (d.status === "success") {
        setNotice({
          type: "ok",
          text: d.data.banned
            ? `Confirmed — user banned (${d.data.warnings} warnings)`
            : `Confirmed — warning issued (${d.data.warnings}/2)`,
        });
        fetchReports(page);
      } else {
        setNotice({ type: "err", text: d.message || "Failed to confirm" });
      }
    } catch {
      setNotice({ type: "err", text: "Failed to confirm" });
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-8">
      <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[1.75rem] text-[var(--text)] mb-2">
        Plagiarism Reports
      </h1>
      <p className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--muted)] mb-6">
        {total} report(s) · confirming issues a warning (2nd offense auto-bans)
      </p>

      {notice && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-sm border font-[family-name:var(--font-mono)] text-[12px] ${
            notice.type === "ok"
              ? "text-[#4ade80] bg-[#0d2e16] border-[#1a5c2d]"
              : "text-[#ff4d4d] bg-[#2d0d0d] border-[#5c1a1a]"
          }`}
        >
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="text-[var(--muted)] font-[family-name:var(--font-mono)] text-[13px] p-8 text-center">
          Loading...
        </div>
      ) : reports.length === 0 ? (
        <div className="text-[var(--muted)] font-[family-name:var(--font-mono)] text-[13px] p-8 text-center">
          No plagiarism reports found.
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["User", "Problem", "Similarity", "Matched With", "Reported", "Status", "Action"].map((h) => (
                  <th key={h} className={TH_CLASS}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const ssClass = STATUS_STYLES[report.status] ?? STATUS_STYLES.PENDING;
                return (
                  <tr key={report.id} className="border-b border-[var(--border-lit)]">
                    <td className={TD_CLASS}>
                      <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                        {userName(report.submission.user)}
                      </span>
                    </td>
                    <td className={TD_CLASS}>
                      <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--muted)]">
                        {report.submission.problem.title}
                      </span>
                    </td>
                    <td className={TD_CLASS}>
                      <span
                        className={`font-[family-name:var(--font-mono)] text-[13px] font-bold ${
                          report.similarityScore >= 0.8
                            ? "text-[#ff4d4d]"
                            : report.similarityScore >= 0.5
                            ? "text-[#ffd700]"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {Math.round(report.similarityScore * 100)}%
                      </span>
                    </td>
                    <td className={TD_CLASS}>
                      <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--muted)]">
                        {userName(report.matchedWithUser)}
                      </span>
                    </td>
                    <td className={TD_CLASS}>
                      <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                        {formatDate(report.createdAt)}
                      </span>
                    </td>
                    <td className={TD_CLASS}>
                      <span
                        className={`font-[family-name:var(--font-mono)] text-[11px] font-bold px-2.5 py-[3px] rounded-sm border whitespace-nowrap ${ssClass}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className={TD_CLASS}>
                      {report.status === "PENDING" ? (
                        <button
                          onClick={() => handleConfirm(report.id)}
                          disabled={confirmingId === report.id}
                          className="font-[family-name:var(--font-mono)] text-[11px] font-bold px-3 py-1.5 rounded-sm border border-[#5c1a1a] bg-[#2d0d0d] text-[#ff4d4d] hover:bg-[#3d1111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {confirmingId === report.id ? "Confirming..." : "Confirm"}
                        </button>
                      ) : (
                        <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                          {report.reviewedBy ? `by ${userName(report.reviewedBy)}` : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6 font-[family-name:var(--font-mono)] text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-sm font-[family-name:var(--font-mono)] text-xs ${
              page === 1
                ? "text-[var(--muted)] cursor-not-allowed"
                : "text-[var(--text)] cursor-pointer"
            }`}
          >
            ← Prev
          </button>
          <span className="text-[var(--muted)] p-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-sm font-[family-name:var(--font-mono)] text-xs ${
              page === totalPages
                ? "text-[var(--muted)] cursor-not-allowed"
                : "text-[var(--text)] cursor-pointer"
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
