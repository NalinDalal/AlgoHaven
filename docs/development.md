# Development

Local development setup for AlgoHaven.

---

## Prerequisites

- [Bun](https://bun.com) `>= 1.2.19`
- [Docker](https://www.docker.com) + Docker Compose

## 1. Start Database (Docker)

```sh
docker compose up
```

This starts PostgreSQL and Redis for local development.

## 2. Configure Environment

```sh
cp .env.example .env
```

Generate secrets and add them to `.env`:

```sh
# macOS/Linux
sed -i '' "s/^WORKER_SECRET=.*/WORKER_SECRET=$(openssl rand -hex 32)/" .env
sed -i '' "s/^POSTGRES_USER=.*/POSTGRES_USER=$(openssl rand -hex 8)/" .env
sed -i '' "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 16)/" .env
```

The worker also requires these shared values in `.env`:

- `BACKEND_URL=http://localhost:3001`
- `WORKER_SECRET=<same secret used by the backend>`

## 3. Run Migrations

```sh
bunx prisma migrate dev --schema=packages/db/prisma/schema.prisma
```

## 4. Start Development

```sh
bun run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## 5. Dev Login (Testing)

For quick testing without email:

```
http://localhost:3000/dev-login
```

---

## Environment Variables

See [`.env.example`](../.env.example) for the full list with defaults:

| Variable                  | Description                                |
| ------------------------- | ------------------------------------------ |
| `DATABASE_URL`            | PostgreSQL connection string              |
| `AUTH_SECRET`             | Secret for signing auth tokens            |
| `SESSION_COOKIE_NAME`     | Cookie name for sessions                  |
| `SESSION_TTL_MS`          | Session lifetime in milliseconds          |
| `WORKER_SECRET`           | Shared secret between backend and worker  |
| `WORKER_URL`              | Worker service URL                        |
| `BACKEND_URL`             | Backend URL (used by worker)              |
| `REDIS_URL`               | Redis connection string                   |
| `REDIS_PASSWORD`          | Redis password                            |
| `CORS_ALLOWED_ORIGINS`    | Comma-separated allowed CORS origins      |
| `CORS_ALLOW_CREDENTIALS`  | Whether to allow credentials in CORS      |