import { useRef, useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";

export function useSubmission(problemId: string, endpoint?: string) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [judgeMsg, setJudgeMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const TERMINAL = [
    "ACCEPTED", "WRONG_ANSWER", "TLE", "MLE", "RUNTIME_ERROR", "COMPILE_ERROR",
  ];

  const pollStatus = (sid: string, attempt = 0) => {
    apiFetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/submissions/${sid}/status`)
      .then((r) => r.json())
      .then((d) => {
        const data = d.data ?? d;
        setResult(data);

        if (data.status === "QUEUED") setJudgeMsg("Waiting in queue...");
        if (data.status === "RUNNING") setJudgeMsg(`Running test ${attempt + 1}...`);

        if (!TERMINAL.includes(data.status)) {
          pollRef.current = setTimeout(() => pollStatus(sid, attempt + 1), 1200);
        } else {
          setSubmitting(false);
          setJudgeMsg("");
        }
      })
      .catch(() => {
        setSubmitting(false);
        setJudgeMsg("");
      });
  };

  const submit = async (code: string, language: string) => {
    setSubmitting(true);
    setResult(null);
    setJudgeMsg("Submitting...");

    try {
      const res = await apiFetch(
        endpoint ?? `${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${problemId}/submission`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code, language }),
        }
      );

      const d = await res.json();
      const data = d.data ?? d;
      const sid = data.submission_id ?? data.submissionId ?? data.id;

      if (sid) {
        setJudgeMsg("Queued...");
        pollStatus(sid);
      } else {
        setSubmitting(false);
      }
    } catch {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  return { submitting, result, judgeMsg, submit };
}