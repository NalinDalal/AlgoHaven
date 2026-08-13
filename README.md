# AlgoHaven

A competitive programming contest platform — Codeforces-style online judge. Solve problems, compete in timed contests with live leaderboards, and climb the rating ladder.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/NalinDalal/AlgoHaven/pulls)

## Features

- **Problem solving** — browse problems, submit solutions in 5 languages (Python, JavaScript, C++, Java, Go) from a Monaco editor, with instant verdicts
- **Secure code execution** — every submission runs in a hardened Docker sandbox (no network, resource-capped, non-root)
- **Contests** — timed contests with per-problem points, two-phase judging (sample tests during contest, full suite after), leaderboard freeze and post-contest plagiarism checks
- **Live leaderboards** — real-time standings pushed over SSE via Redis pub/sub
- **Rating system** — post-contest Elo-style ratings, automatically calculated after a 3-day delay
- **Virtual contests** — practice on past contests with the original scoring rules
- **User dashboards** — streak tracking, GitHub-style submission heatmap, badges, and contest stats
- **Admin tooling** — problem/contest CRUD, user management, rejudges, and custom checkers

## Tech Stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Frontend  | Next.js, React, Monaco Editor                     |
| Backend   | Bun (Hono-compatible API), Prisma ORM             |
| Worker    | Bun + Docker sandbox (Docker-in-Docker)           |
| Realtime  | Bun + SSE, Redis pub/sub                          |
| Data      | PostgreSQL, Redis, BullMQ (job queues)            |
| Infra     | Docker Compose, GitHub Actions → EC2, Turborepo   |

## Quick Start

```sh
# 1. Start PostgreSQL + Redis
docker compose up

# 2. Configure environment
cp .env.example .env
# (fill in WORKER_SECRET, POSTGRES_USER, POSTGRES_PASSWORD — see docs/development.md)

# 3. Run migrations
bunx prisma migrate dev --schema=packages/db/prisma/schema.prisma

# 4. Start all services
bun run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Worker: http://localhost:3002
- Real-time (SSE): http://localhost:3003

Dev login (no email needed for testing): `http://localhost:3000/dev-login?secret=<DEV_LOGIN_SECRET>`

## Repository Structure

```
apps/
├── fe/       # Next.js frontend           (:3000)
├── be/       # REST API server            (:3001)
├── worker/   # Code execution sandbox     (:3002)
└── ws/       # Real-time SSE server       (:3003)
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

## Documentation

| Doc                                        | Contents                              |
| ------------------------------------------ | ------------------------------------- |
| [Development](docs/development.md)         | Local setup, env variables, dev login |
| [Architecture](docs/architecture.md)       | Service diagram, data flows, monorepo |
| [API Reference](docs/api.md)               | Endpoints, auth, response format, curl |
| [Database](docs/database.md)               | Prisma schema, enums, test cases      |
| [Code Execution](docs/code-execution.md)   | Docker sandbox, languages, verdicts   |
| [Deployment](docs/deployment.md)           | EC2 setup, prod env, CI/CD            |
| [System Design](docs/design.md)            | Design decisions & rationale          |
| [Roadmap](docs/roadmap.md)                 | Development status & checklist        |
| [Features](docs/features.md)               | Completed feature checklist           |

## Scripts

From the repository root ([Bun](https://bun.com) required):

```sh
bun run dev          # Start all services in watch mode
bun run build        # Build all packages and apps
bun run lint         # Lint all packages and apps
bun run check-types  # Type-check all packages and apps
bun run format       # Format all TS/TSX/MD files with Prettier
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Make sure existing checks pass (`bun run lint`, `bun run check-types`) and tests are updated where relevant.

## License

[MIT](LICENSE) © 2026 Nalin Dalal