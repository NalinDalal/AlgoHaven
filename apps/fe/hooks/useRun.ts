import { useRef, useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";
import type { SubmissionResult } from "@/components/problemWrapper";

const TERMINAL = [
  "ACCEPTED", "WRONG_ANSWER", "TLE", "MLE", "RUNTIME_ERROR", "COMPILE_ERROR",
];

export function useRun(problemId: string) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [judgeMsg, setJudgeMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pollRun = (runId: string, attempt = 0) => {
    apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/runs/${runId}`)
      .then((r) => r.json())
      .then((d) => {
        const data = d.data ?? d;
        setResult((prev) => ({ ...prev, ...data, id: runId } as SubmissionResult));

        if (data.status === "QUEUED") setJudgeMsg("Waiting in queue...");
        if (data.status === "RUNNING") setJudgeMsg(`Running sample ${attempt + 1}...`);

        if (!TERMINAL.includes(data.status)) {
          pollRef.current = setTimeout(() => pollRun(runId, attempt + 1), 1200);
        } else {
          setRunning(false);
          setJudgeMsg("");
        }
      })
      .catch(() => {
        setRunning(false);
        setJudgeMsg("");
      });
  };

  const run = async (code: string, language: string) => {
    setRunning(true);
    setResult(null);
    setJudgeMsg("Running on samples...");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${problemId}/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code, language }),
        }
      );

      const d = await res.json();
      const data = d.data ?? d;
      const runId: string | undefined = data.runId ?? data.id;

      if (runId) {
        setResult({ id: runId, status: "QUEUED" });
        pollRun(runId);
      } else {
        setRunning(false);
        setJudgeMsg(data?.message ?? "Failed to start run");
      }
    } catch {
      setRunning(false);
      setJudgeMsg("Failed to start run");
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  return { running, result, judgeMsg, run };
}