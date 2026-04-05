# @algohaven/redis

Redis client with pub/sub helpers for real-time features.

## Architecture

```mermaid
flowchart LR
    subgraph Backend["Backend (:3001)"]
        Publish[publishLeaderboardUpdate]
    end

    subgraph Redis["Redis (:6379)"]
        PubSub[(Pub/Sub)]
        LBC[contest:{id}:leaderboard]
        ANC[contest:{id}:announcements]
    end

    subgraph Realtime["Real-time Server (:3003)"]
        Sub[Redis Subscriber]
        SSE[SSE Handler]
    end

    Publish -->|publish| PubSub
    PubSub -->|subscribe| LBC
    PubSub -->|subscribe| ANC
    Sub -->|listen| PubSub
    SSE -->|broadcast| Clients
```

## Setup

Ensure Redis is running (from project root):

```bash
docker-compose up -d redis
```

## Usage

```typescript
import {
  redis,
  connectRedis,
  disconnectRedis,
  publishLeaderboardUpdate,
  publishAnnouncement,
  subscribeToLeaderboard,
  subscribeToAnnouncements,
} from "@algohaven/redis";
```

### Connection

```typescript
// Auto-connects on first use
await connectRedis();

// Or just use directly - auto-connects
const value = await redis.get("key");
```

### Publishing

```typescript
// Broadcast leaderboard update to a contest
await publishLeaderboardUpdate("contest-123", {
  contestId: "contest-123",
  entries: [
    {
      userId: "user-1",
      username: "alice",
      totalPoints: 100,
      solved: 2,
      penaltyMins: 5,
      rank: 1,
    },
  ],
});

// Broadcast announcement
await publishAnnouncement("contest-123", {
  contestId: "contest-123",
  announcement: {
    id: "ann-1",
    message: "Contest extended!",
    createdAt: new Date().toISOString(),
  },
});
```

### Subscribing

```typescript
// Subscribe to leaderboard updates for a contest
const unsubscribe = await subscribeToLeaderboard("contest-123", (data) => {
  console.log("Leaderboard update:", data);
});

// Clean up
unsubscribe();

// Subscribe to announcements
const unsubscribeAnn = await subscribeToAnnouncements("contest-123", (data) => {
  console.log("Announcement:", data);
});
```

### Channel Names

- Leaderboard: `contest:{contestId}:leaderboard`
- Announcements: `contest:{contestId}:announcements`

Use `"all"` as contestId to subscribe to all contests (used by WS server).

## Environment Variables

- `REDIS_URL` - Redis connection string (default: `redis://localhost:6379`)
