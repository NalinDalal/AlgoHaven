# Architecture

AlgoHaven is a monorepo of four services, built with [Turborepo](https://turbo.build) + Bun.

```mermaid
flowchart TB
    subgraph Client["Frontend (Next.js - :3000)"]
        FE[Next.js App]
        Monaco[Monaco Editor]
        SSE[SSE Client]
    end

    subgraph Backend["Backend (Bun - :3001)"]
        API[API Server]
        Auth[Auth Middleware]
        Prisma[Prisma ORM]
    end

    subgraph Worker["Worker (Bun - :3002)"]
        Queue[Job Queue]
        Docker[Docker Sandbox]
    end

    subgraph Realtime["Real-time Server (Bun - :3003)"]
        SSE_Server[SSE Handler]
        RedisSub[Redis Subscriber]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL)]
        Redis[(Redis)]
    end

    FE -->|HTTP| API
    FE -->|SSE /ws/contest/:id| SSE_Server
    Monaco -->|Submit Code| API
    API --> Prisma
    API -->|Enqueue Job| Queue
    Queue --> Docker
    Docker -->|Update Result| API
    API -->|Publish Update| Redis
    RedisSub -->|Subscribe| Redis
    SSE_Server -->|Broadcast| FE
    Prisma --> PG
```

## Service Ports

| Service   | Port | Purpose         |
| --------- | ---- | --------------- |
| Frontend  | 3000 | Next.js UI      |
| Backend   | 3001 | REST API        |
| Worker    | 3002 | Code execution  |
| Real-time | 3003 | SSE / WebSocket |

## Data Flow: Submission

```mermaid
sequenceDiagram
    participant User
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL
    participant W as Worker
    participant Redis
    participant SSE as Real-time

    User->>FE: Submit code
    FE->>BE: POST /api/problems/:id/submission
    BE->>DB: Create submission (QUEUED)
    BE->>W: Enqueue job
    W->>W: Process in Docker
    W->>BE: Update status (ACCEPTED/WRONG_ANSWER)
    BE->>DB: Update submission
    BE->>DB: Calculate leaderboard
    BE->>Redis: Publish LEADERBOARD_UPDATE
    Redis->>SSE: Push update
    SSE->>FE: Broadcast to clients
    FE->>User: Live leaderboard update
```

## Data Flow: Real-time Leaderboard

```mermaid
flowchart LR
    subgraph Submit["Submission Processing"]
        S1["Worker updates submission status"]
        S2["Backend calculates new scores"]
        S3["Update leaderboard entry in DB"]
    end

    subgraph Publish["Redis Pub/Sub"]
        P1["Publish to contest:{id}:leaderboard"]
    end

    subgraph Broadcast["Real-time Server"]
        R1["Subscribe to Redis channel"]
        R2["Broadcast via SSE to connected clients"]
    end

    S1 --> S2 --> S3 --> P1 --> R1 --> R2
```

## Repository Structure

```
apps/
├── fe/       # Next.js frontend (:3000)
├── be/       # Backend API server (:3001)
├── worker/   # Code execution sandbox (Docker-in-Docker) (:3002)
└── ws/       # Real-time SSE server (:3003)
packages/
├── auth/             # Auth + session handling
├── db/               # Prisma schema, client & migrations
├── redis/            # Redis client + pub/sub helpers
├── ui/               # Shared UI components
├── logger/           # Shared logging
├── utils/            # Shared utilities
├── eslint-config/    # Shared ESLint config
└── typescript-config # Shared TS config
```

For a detailed analysis of the system design decisions, see [System Design](./design.md). For the code execution pipeline, see [Code Execution](./code-execution.md).