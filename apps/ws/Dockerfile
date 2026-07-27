FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies from monorepo root
COPY package.json bun.lock ./
COPY packages/logger/package.json packages/logger/
COPY packages/redis/package.json packages/redis/
COPY packages/utils/package.json packages/utils/
COPY apps/ws/package.json apps/ws/
RUN bun install --frozen-lockfile

# Copy workspace packages
COPY packages/logger packages/logger
COPY packages/redis packages/redis
COPY packages/utils packages/utils

# Copy ws source
COPY apps/ws apps/ws

EXPOSE 3003
WORKDIR /app/apps/ws
CMD ["bun", "run", "index.ts"]
