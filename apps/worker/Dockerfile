FROM oven/bun:1 AS base
WORKDIR /app

# Install Docker CLI (worker spawns containers for code execution)
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

# Install dependencies from monorepo root
COPY package.json bun.lock ./
COPY packages/logger/package.json packages/logger/
COPY packages/redis/package.json packages/redis/
COPY packages/utils/package.json packages/utils/
COPY apps/worker/package.json apps/worker/
RUN bun install --frozen-lockfile

# Copy workspace packages
COPY packages/logger packages/logger
COPY packages/redis packages/redis
COPY packages/utils packages/utils

# Copy worker source
COPY apps/worker apps/worker

EXPOSE 3002
WORKDIR /app/apps/worker
CMD ["bun", "run", "index.ts"]
