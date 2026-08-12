# Deployment

Deploy AlgoHaven to a single EC2 instance with Docker Compose, either manually or automatically via GitHub Actions.

---

## Prerequisites

- EC2 instance (Ubuntu 22.04+) with Docker + Docker Compose installed
- GitHub repository with these secrets configured:
  - `EC2_HOST` — your EC2 public IP
  - `EC2_USERNAME` — typically `ubuntu`
  - `EC2_SSH_KEY` — private SSH key

## One-time EC2 setup

```sh
# SSH into your EC2 instance
ssh ubuntu@<EC2_HOST>

# Clone the repo
git clone https://github.com/<your-org>/AlgoHaven.git
cd AlgoHaven

# Create production .env
cp .env.example .env
# Edit .env with production values (see below)
```

## Production .env variables

```sh
DATABASE_URL="postgresql://postgres:<strong-password>@db:5432/algohaven"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=algohaven

AUTH_SECRET=<random-64-char-hex>
SESSION_COOKIE_NAME=algohaven_session
SESSION_TTL_MS=604800000

WORKER_SECRET=<random-64-char-hex>
WORKER_URL=http://worker:3002
BE_URL=http://be:3001

REDIS_URL=redis://:<strong-redis-password>@redis:6379
REDIS_PASSWORD=<strong-redis-password>

NEXT_PUBLIC_BE_URL=http://<EC2_HOST>:3001
CORS_ALLOWED_ORIGINS=http://<EC2_HOST>:3000
```

## Manual deploy

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

## CI/CD (automatic on push to main)

Pushing to `main` triggers GitHub Actions ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)) which SSHes into EC2 and runs:

```sh
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec -T be bunx prisma migrate deploy --schema=../../packages/db/prisma/schema.prisma
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js UI |
| Backend | 3001 | REST API |
| Worker | 3002 | Code execution (Docker-in-Docker) |
| WebSocket | 3003 | SSE real-time updates |

## Useful commands

```sh
# View logs
docker compose -f docker-compose.prod.yml logs -f be
docker compose -f docker-compose.prod.yml logs -f worker

# Run Prisma migration manually
docker compose -f docker-compose.prod.yml exec be bunx prisma migrate deploy --schema=../../packages/db/prisma/schema.prisma

# Restart a single service
docker compose -f docker-compose.prod.yml restart worker
```