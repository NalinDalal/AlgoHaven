FROM node:20-alpine AS base
WORKDIR /app

ARG NEXT_PUBLIC_BE_URL=http://localhost:3001
ENV NEXT_PUBLIC_BE_URL=$NEXT_PUBLIC_BE_URL

# Install Bun
RUN npm install -g bun@1

# Install dependencies
COPY package.json bun.lock ./
COPY packages/auth/package.json packages/auth/
COPY packages/ui/package.json packages/ui/
COPY apps/fe/package.json apps/fe/
RUN bun install --frozen-lockfile

# Copy source
COPY packages/auth packages/auth
COPY packages/ui packages/ui
COPY apps/fe apps/fe

# Build Next.js
WORKDIR /app/apps/fe
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
