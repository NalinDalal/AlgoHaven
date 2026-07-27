FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies from monorepo root
COPY package.json bun.lock ./
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/logger/package.json packages/logger/
COPY packages/redis/package.json packages/redis/
COPY packages/utils/package.json packages/utils/
COPY apps/be/package.json apps/be/
RUN bun install --frozen-lockfile

# Copy workspace packages and generate Prisma client
COPY packages/auth packages/auth
COPY packages/db packages/db
COPY packages/logger packages/logger
COPY packages/redis packages/redis
COPY packages/utils packages/utils
RUN bunx prisma generate --schema=packages/db/prisma/schema.prisma

# Copy backend source
COPY apps/be apps/be

# Entrypoint: run migrations then start server
COPY apps/be/docker-entrypoint.sh /app/apps/be/docker-entrypoint.sh
RUN chmod +x /app/apps/be/docker-entrypoint.sh

EXPOSE 3001
WORKDIR /app/apps/be
ENTRYPOINT ["../../apps/be/docker-entrypoint.sh"]
