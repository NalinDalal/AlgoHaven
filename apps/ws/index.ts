import { serve } from "bun";
import { config } from "dotenv";
import {
    subscribeToLeaderboard,
    subscribeToAnnouncements,
    connectRedis,
} from "@algohaven/redis";

config({ path: "../../.env" });

const PORT = parseInt(process.env.WS_PORT || "3003");
const BACKEND_URL = process.env.BE_URL || "http://localhost:3001";

interface LeaderboardEntry {
    userId: string;
    username: string;
    totalPoints: number;
    solved: number;
    penaltyMins: number;
    rank: number;
}

interface Announcement {
    id: string;
    message: string;
    createdAt: string;
}

interface SSEClient {
    contestId: string;
    userId: string | null;
    controller: ReadableStreamDefaultController<Uint8Array>;
    encoder: TextEncoder;
}

const sseClients = new Map<string, SSEClient>();
const contestClients = new Map<string, Set<string>>();

const CLEANUP_INTERVAL_MS = 60000;

function generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
}

function addClientToContest(clientId: string, contestId: string): void {
    if (!contestClients.has(contestId)) {
        contestClients.set(contestId, new Set());
    }
    contestClients.get(contestId)!.add(clientId);
}

function removeClientFromContest(clientId: string, contestId: string): void {
    const conns = contestClients.get(contestId);
    if (conns) {
        conns.delete(clientId);
        if (conns.size === 0) {
            contestClients.delete(contestId);
        }
    }
}

function broadcastToContest(
    contestId: string,
    eventType: string,
    data: unknown,
): void {
    const conns = contestClients.get(contestId);
    if (!conns) return;

    for (const clientId of conns) {
        const client = sseClients.get(clientId);
        if (client?.controller) {
            try {
                client.controller.enqueue(
                    client.encoder.encode(
                        `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`,
                    ),
                );
            } catch (e) {
                console.error("[SSE] Failed to broadcast:", e);
            }
        }
    }
}

async function validateSession(cookie: string): Promise<string | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
            headers: { Cookie: cookie },
        });
        if (res.ok) {
            const data = await res.json();
            return data.data?.user?.id ?? null;
        }
    } catch (e) {
        console.error("[SSE] Session validation failed:", e);
    }
    return null;
}

async function startRedisSubscriptions(): Promise<void> {
    await connectRedis();

    await subscribeToLeaderboard("all", (data: unknown) => {
        const update = data as { contestId: string; entries: LeaderboardEntry[] };
        if (update.contestId) {
            broadcastToContest(
                update.contestId,
                "LEADERBOARD_UPDATE",
                update.entries,
            );
        }
    });

    await subscribeToAnnouncements("all", (data: unknown) => {
        const announcement = data as {
            contestId: string;
            announcement: Announcement;
        };
        if (announcement.contestId) {
            broadcastToContest(
                announcement.contestId,
                "ANNOUNCEMENT",
                announcement.announcement,
            );
        }
    });

    console.log("[SSE] Redis subscriptions active");
}

function startCleanupJob(): void {
    setInterval(() => {
        for (const [clientId, client] of sseClients) {
            try {
                if (!client.controller) {
                    sseClients.delete(clientId);
                    removeClientFromContest(clientId, client.contestId);
                }
            } catch {
                sseClients.delete(clientId);
                removeClientFromContest(clientId, client.contestId);
            }
        }
    }, CLEANUP_INTERVAL_MS);
}

const server = serve({
    port: PORT,
    fetch(request) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        if (pathname.startsWith("/sse/contest/")) {
            const contestId = pathname.split("/sse/contest/")[1];
            if (!contestId) {
                return new Response("Missing contest ID", { status: 400 });
            }

            const cookie = request.headers.get("cookie") || "";
            const clientId = generateClientId();

            const stream = new ReadableStream<Uint8Array>({
                start(controller) {
                    const encoder = new TextEncoder();

                    const sendEvent = (type: string, data: unknown) => {
                        try {
                            controller.enqueue(encoder.encode(`event: ${type}\n`));
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
                            );
                        } catch {
                            sseClients.delete(clientId);
                            removeClientFromContest(clientId, contestId);
                        }
                    };

                    const client: SSEClient = {
                        contestId,
                        userId: null,
                        controller,
                        encoder,
                    };

                    sseClients.set(clientId, client);
                    addClientToContest(clientId, contestId);

                    validateSession(cookie)
                        .then((userId) => {
                            client.userId = userId;
                            sendEvent("CONNECTED", { contestId, clientId, userId });
                        })
                        .catch(() => {
                            sendEvent("CONNECTED", { contestId, clientId, userId: null });
                        });

                    const heartbeat = setInterval(() => {
                        sendEvent("PING", { time: Date.now() });
                    }, 30000);

                    request.signal.addEventListener("abort", () => {
                        clearInterval(heartbeat);
                        sseClients.delete(clientId);
                        removeClientFromContest(clientId, contestId);
                        try {
                            controller.close();
                        } catch { }
                    });
                },
            });

            return new Response(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
            });
        }

        if (pathname === "/health") {
            return new Response(
                JSON.stringify({
                    status: "ok",
                    clients: sseClients.size,
                    contests: contestClients.size,
                }),
                { headers: { "Content-Type": "application/json" } },
            );
        }

        return new Response("Not Found", { status: 404 });
    },
});

startRedisSubscriptions().catch(console.error);
startCleanupJob();

console.log(`[SSE] Server running on port ${PORT}`);
console.log(`[SSE] Endpoints:`);
console.log(`  SSE /sse/contest/:id - Server-Sent Events`);
