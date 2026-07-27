#!/bin/sh
set -e

echo "Running Prisma migrations..."
bunx prisma migrate deploy --schema=../../packages/db/prisma/schema.prisma

echo "Starting backend server..."
exec bun run index.ts
