import { useRef, useState, useEffect } from "react";

export function useSubmission(problemId: string, endpoint?: string) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [judgeMsg, setJudgeMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const TERMINAL = [
    "ACCEPTED", "WRONG_ANSWER", "TLE", "MLE", "RUNTIME_ERROR", "COMPILE_ERROR",
  ];

  const pollStatus = (sid: string, attempt = 0) => {
    fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/submissions/${sid}/status`)
      .then((r) => r.json())
      .then((d) => {
        setResult(d);

        if (d.status === "QUEUED") setJudgeMsg("Waiting in queue...");
        if (d.status === "RUNNING") setJudgeMsg(`Running test ${attempt + 1}...`);

        if (!TERMINAL.includes(d.status)) {
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
      const res = await fetch(
        endpoint ?? `${process.env.NEXT_PUBLIC_BE_URL}/api/problems/${problemId}/submission`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language }),
        }
      );

      const d = await res.json();
      const sid = d.submissionId ?? d.id;

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