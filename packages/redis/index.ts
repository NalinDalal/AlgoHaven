import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    lazyConnect: true,
});

redis.on("connect", () => {
    console.log("[Redis] Connected to", REDIS_URL);
});

redis.on("error", (err) => {
    console.error("[Redis] Error:", err.message);
});

export const leaderboardChannel = (contestId: string) =>
    `contest:${contestId}:leaderboard`;
export const announcementChannel = (contestId: string) =>
    `contest:${contestId}:announcements`;

export async function publishLeaderboardUpdate(
    contestId: string,
    data: unknown,
): Promise<void> {
    const channel = leaderboardChannel(contestId);
    await redis.publish(channel, JSON.stringify(data));
}

export async function publishAnnouncement(
    contestId: string,
    data: unknown,
): Promise<void> {
    const channel = announcementChannel(contestId);
    await redis.publish(channel, JSON.stringify(data));
}

export async function subscribeToLeaderboard(
    contestId: string,
    callback: (data: unknown) => void,
): Promise<() => void> {
    const channel = leaderboardChannel(contestId);
    const subscriber = new Redis(REDIS_URL);

    subscriber.on("message", (ch, message) => {
        if (ch === channel) {
            try {
                callback(JSON.parse(message));
            } catch (e) {
                console.error("[Redis] Failed to parse message:", e);
            }
        }
    });

    await subscriber.subscribe(channel);

    return () => {
        subscriber.unsubscribe(channel).then(() => subscriber.quit());
    };
}

export async function subscribeToAnnouncements(
    contestId: string,
    callback: (data: unknown) => void,
): Promise<() => void> {
    const channel = announcementChannel(contestId);
    const subscriber = new Redis(REDIS_URL);

    subscriber.on("message", (ch, message) => {
        if (ch === channel) {
            try {
                callback(JSON.parse(message));
            } catch (e) {
                console.error("[Redis] Failed to parse message:", e);
            }
        }
    });

    await subscriber.subscribe(channel);

    return () => {
        subscriber.unsubscribe(channel).then(() => subscriber.quit());
    };
}

export async function connectRedis(): Promise<void> {
    await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
    await redis.quit();
}
