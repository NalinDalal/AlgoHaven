# API Reference

REST API for AlgoHaven (backend runs on port `3001`).

---

## Authentication

- Password-based authentication
- Session management with HttpOnly cookies
- Role-based access (USER/ADMIN)

### Endpoints

| Endpoint              | Method | Description          |
| --------------------- | ------ | -------------------- |
| `/api/auth/signout`   | POST   | Sign out             |
| `/api/auth/me`        | GET    | Get current user     |
| `/api/auth/dev-login` | POST   | Dev-only quick login |

## Response Format

All API responses use a consistent format:

```json
{
  "status": "success",
  "message": "Operation description",
  "data": { ... },
  "error": null,
  "timestamp": "2026-03-21T..."
}
```

---

## Problems

| Endpoint                       | Method | Auth  | Description         |
| ------------------------------ | ------ | ----- | ------------------- |
| `/api/problems`                | GET    | -     | List problems       |
| `/api/problems/:id`            | GET    | -     | Get problem details |
| `/api/problem/create`          | POST   | ADMIN | Create problem      |
| `/api/problems/:id/submission` | POST   | USER  | Submit solution     |

## Contests

| Endpoint                         | Method   | Auth    | Description              |
| -------------------------------- | -------- | ------- | ------------------------ |
| `/api/contest`                   | GET      | -       | List contests            |
| `/api/contest/create`            | POST     | ADMIN   | Create contest           |
| `/api/contest/:id`               | GET      | -       | Get contest details      |
| `/api/contest/:id/register`      | POST     | USER    | Register for contest     |
| `/api/contest/:id/unregister`    | POST     | USER    | Unregister               |
| `/api/contest/:id/problems`      | GET      | USER    | Get contest problems     |
| `/api/contest/:id/submission`    | POST     | USER    | Submit to contest        |
| `/api/contest/:id/leaderboard`   | GET      | -       | Get leaderboard          |
| `/api/contest/:id/ratings`       | GET      | -       | Get ratings              |
| `/api/contest/:id/announcements` | GET/POST | -/ADMIN | Get/create announcements |
| `/api/contest/:id/freeze`        | POST     | Worker  | Freeze leaderboard       |

## Submissions

| Endpoint                      | Method | Auth | Description           |
| ----------------------------- | ------ | ---- | --------------------- |
| `/api/submissions/:id/status` | GET    | USER | Get submission status |

## Worker (port 3002)

Protected by the `x-worker-secret` header (or `WORKER_SECRET` env value):

| Endpoint                                | Method | Auth   | Description                     |
| --------------------------------------- | ------ | ------ | ------------------------------- |
| `/api/worker/health`                    | GET    | -      | Worker health check             |
| `/api/worker/enqueue`                   | POST   | Secret | Enqueue code for execute        |
| `/api/worker/update-submission`         | POST   | Secret | Update submission result        |
| `/api/worker/schedule-rating`           | POST   | Secret | Schedule rating calc job        |
| `/api/worker/schedule-phase-transition` | POST   | Secret | Schedule phase 1→2 job          |
| `/api/worker/schedule-freeze`           | POST   | Secret | Schedule leaderboard freeze job |
| `/api/worker/transition-judge-phase`    | POST   | Secret | Transition phase 1→2            |

---

## Testing with curl

```bash
# Login to get session cookie
curl -c cookies.txt -X POST http://localhost:3001/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'

# Submit solution (replace :problemId)
curl -X POST "http://localhost:3001/api/problems/:problemId/submission" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"code":"console.log(1)","language":"javascript"}'

# Check submission status (replace :submissionId)
curl "http://localhost:3001/api/submissions/:submissionId/status" -b cookies.txt

# Worker health
curl http://localhost:3002/api/worker/health

# Worker enqueue (direct)
curl -X POST http://localhost:3002/api/worker/enqueue \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(1+1)"}'
```