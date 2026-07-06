"use client";

import { RouteError } from "@/components/RouteError";

export default function AdminContestsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} />;
}
