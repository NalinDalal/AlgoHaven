"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

interface RejudgeJob {
  id: string;
  problemId: string;
  contestId: string | null;
  status: string;
  totalCount: number;
  doneCount: number;
  errorLog: string | null;
  createdAt: string;
  updatedAt: string;
  triggeredBy: { id: string; username: string | null; email: string };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]",
  RUNNING: "text-[var(--blue)] bg-[#0d1a2d] border-[#1a3a6e]",
  DONE: "text-[#4ade80] bg-[#0d2e16] border-[#1a5c2d]",
  FAILED: "text-[#ff4d4d] bg-[#2d0d0d] border-[#5c1a1a]",
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

export default function RejudgeJobsPage() {
  const [jobs, setJobs] = useState<RejudgeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/admin/rejudge-jobs?${params}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setJobs(data.data.jobs);
          if (data.data?.meta) {
            setTotalPages(data.data.meta.totalPages);
            setTotal(data.data.meta.total);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  // Auto-refresh running jobs
  useEffect(() => {
    const hasRunning = jobs.some((j) => j.status === "RUNNING" || j.status === "PENDING");
    if (!hasRunning) return;

    const interval = setInterval(() => {
      setPage((p) => p); // triggers refetch
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs]);

  return (
    <div className="max-w-[1200px] mx-auto p-8">
      <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-[1.75rem] text-[var(--text)] mb-6">
        Rejudge Jobs
      </h1>

      {loading ? (
        <div className="text-[var(--muted)] font-[family-name:var(--font-mono)] text-[13px] p-8 text-center">
          Loading...
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-[var(--muted)] font-[family-name:var(--font-mono)] text-[13px] p-8 text-center">
          No rejudge jobs found.
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Problem", "Contest", "Status", "Progress", "Triggered By", "Created", "Errors"].map((h) => (
                  <th key={h} className={TH_CLASS}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const ssClass = STATUS_STYLES[job.status] ?? STATUS_STYLES.PENDING;
                const progress = job.totalCount > 0
                  ? Math.round((job.doneCount / job.totalCount) * 100)
                  : 0;

                return (
                  <tr
                    key={job.id}
                    className="border-b border-[var(--border-lit)]"
                  >
                    {/* Problem */}
                    <td className={TD_CLASS}>
                      <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                        {job.problemId.slice(0, 8)}...
                      </span>
                    </td>

                    {/* Contest */}
                    <td className={TD_CLASS}>
                      <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--muted)]">
                        {job.contestId ? job.contestId.slice(0, 8) + "..." : "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className={TD_CLASS}>
                      <span
                        className={`font-[family-name:var(--font-mono)] text-[11px] font-bold px-2.5 py-[3px] rounded-sm border whitespace-nowrap ${ssClass}`}
                      >
                        {job.status}
                      </span>
                    </td>

                    {/* Progress */}
                    <td className={TD_CLASS}>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[var(--bg)] rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              job.status === "DONE"
                                ? "bg-[#4ade80]"
                                : job.status === "FAILED"
                                ? "bg-[#ff4d4d]"
                                : "bg-[var(--blue)]"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)] whitespace-nowrap">
                          {job.doneCount}/{job.totalCount}
                        </span>
                      </div>
                    </td>

                    {/* Triggered By */}
                    <td className={TD_CLASS}>
                      <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--muted)]">
                        {job.triggeredBy.username || job.triggeredBy.email}
                      </span>
                    </td>

                    {/* Created */}
                    <td className={TD_CLASS}>
                      <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                        {formatDate(job.createdAt)}
                      </span>
                    </td>

                    {/* Errors */}
                    <td className={TD_CLASS}>
                      {job.errorLog ? (
                        <span
                          className="font-[family-name:var(--font-mono)] text-[11px] text-[#ff4d4d] cursor-help"
                          title={job.errorLog}
                        >
                          {job.errorLog.split("\n").length} error(s)
                        </span>
                      ) : (
                        <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                          —
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

      {/* Pagination */}
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
