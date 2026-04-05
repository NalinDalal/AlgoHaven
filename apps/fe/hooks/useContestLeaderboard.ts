import { useEffect, useRef, useState, useCallback } from "react";

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  solved: number;
  penaltyMins: number;
  rank: number;
}

interface UseContestLeaderboardOptions {
  contestId: string;
  pollFallback?: boolean;
  pollInterval?: number;
}

interface UseContestLeaderboardResult {
  entries: LeaderboardEntry[];
  userRank: number | null;
  isFrozen: boolean;
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected" | "fallback";
  refresh: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3003";
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || "http://localhost:3001";

export function useContestLeaderboard({
  contestId,
  pollFallback = true,
  pollInterval = 5000,
}: UseContestLeaderboardOptions): UseContestLeaderboardResult {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "fallback"
  >("connecting");

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${BE_URL}/api/contest/${contestId}/leaderboard`);
      const data = await res.json();
      if (data.status === "success" && data.data) {
        setEntries(data.data.top || []);
        setUserRank(data.data.userRank);
        setIsFrozen(data.data.isFrozen || false);
      }
    } catch (err) {
      console.error("[Leaderboard] Fetch failed:", err);
    }
  }, [contestId]);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus("connecting");
    const eventSource = new EventSource(`${WS_URL}/sse/contest/${contestId}`);

    eventSource.onopen = () => {
      setConnectionStatus("connected");
      reconnectAttempts.current = 0;
    };

    eventSource.addEventListener("LEADERBOARD_UPDATE", (event) => {
      try {
        const data = JSON.parse(event.data);
        setEntries(data);
        const me = data.find(
          (e: LeaderboardEntry) => e.userId === "current-user",
        );
        if (me) setUserRank(me.rank);
      } catch (err) {
        console.error("[Leaderboard] Parse error:", err);
      }
    });

    eventSource.addEventListener("CONNECTED", () => {
      setConnectionStatus("connected");
      fetchLeaderboard();
    });

    eventSource.onerror = () => {
      eventSource.close();
      setConnectionStatus("disconnected");

      if (reconnectAttempts.current < maxReconnectAttempts && pollFallback) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          30000,
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connectSSE();
        }, delay);
      } else if (pollFallback) {
        setConnectionStatus("fallback");
        startPolling();
      }
    };

    eventSourceRef.current = eventSource;
  }, [contestId, pollFallback, fetchLeaderboard]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;

    fetchLeaderboard();
    pollRef.current = setInterval(fetchLeaderboard, pollInterval);
  }, [fetchLeaderboard, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopPolling();
    };
  }, [contestId]);

  return {
    entries,
    userRank,
    isFrozen,
    isConnected: connectionStatus === "connected",
    connectionStatus,
    refresh,
  };
}
