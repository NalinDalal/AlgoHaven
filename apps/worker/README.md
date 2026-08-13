# worker

Code execution service (port 3002). Consumes BullMQ jobs from Redis, runs
submissions in Docker sandboxes, and reports results back to the backend.

```
Backend API
│
▼
POST /api/worker/enqueue
│
▼
BullMQ queue (Redis) — "submissions"
│
▼
Docker container execution
│
▼
Compare output with expected output
│
▼
POST /api/worker/update-submission → Backend
```

Also runs delayed BullMQ jobs:
- `ratings` — `/api/contest/:id/calculate-ratings` + plagiarism check (3 days after contest)
- `phase-transitions` — judge phase 1 → 2 at contest end
- `freezes` — leaderboard freeze at freeze time

Run with `WORKER_SECRET` and `BE_URL` set (and the sandbox Docker socket
mounted in production).