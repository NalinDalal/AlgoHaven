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
| `/api/auth/register`  | POST   | Register an account  |
| `/api/auth/login`     | POST   | Login                |
| `/api/auth/signout`   | POST   | Sign out             |
| `/api/auth/me`        | GET    | Get current user     |
| `/api/auth/dev-login` | POST   | Dev-only quick login (requires `DEV_LOGIN_SECRET`) |
| `/api/me`             | GET    | Current user's dashboard data |
| `/api/profile/:username` | GET | Public profile       |

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

| Endpoint                       | Method   | Auth  | Description         |
| ------------------------------ | -------- | ----- | ------------------- |
| `/api/problems`                | GET      | -     | List problems       |
| `/api/problems/:id`            | GET      | -     | Get problem details |
| `/api/problems/:id`            | PUT/DELETE | ADMIN | Update/delete problem |
| `/api/problem/create`          | POST     | ADMIN | Create problem      |
| `/api/problems/:id/submission` | POST     | USER  | Submit solution     |
| `/api/problems/:id/run`        | POST     | USER  | Run against sample cases (no submission) |
| `/api/runs/:runId`             | GET      | -     | Poll sample run result |

## Contests

| Endpoint                              | Method   | Auth    | Description              |
| ------------------------------------- | -------- | ------- | ------------------------ |
| `/api/contest`                        | GET      | -       | List contests            |
| `/api/contest/create`                 | POST     | ADMIN   | Create contest           |
| `/api/contest/:id`                    | GET      | -       | Get contest details      |
| `/api/contest/:id`                    | PUT/DELETE | ADMIN | Update/delete contest    |
| `/api/contest/:id/register`           | POST     | USER    | Register for contest     |
| `/api/contest/:id/unregister`         | POST     | USER    | Unregister               |
| `/api/contest/:id/problems`           | GET      | USER    | Get contest problems     |
| `/api/contest/:id/problems/:problemId`| GET/POST | USER    | Get problem / submit solution |
| `/api/contest/:id/leaderboard`        | GET      | -       | Get leaderboard          |
| `/api/contest/:id/ratings`            | GET      | -       | Get ratings              |
| `/api/contest/:id/announcements`      | GET/POST | -/ADMIN | Get/create announcements |
| `/api/contest/:id/freeze`             | POST     | Worker  | Freeze leaderboard       |
| `/api/contest/:id/calculate-ratings`  | POST     | ADMIN/Worker | Calculate ratings (after contest) |
| `/api/contest/:id/recent-submissions` | GET      | -       | Recent verdicts for home page ticker |

## Submissions

| Endpoint                      | Method | Auth | Description           |
| ----------------------------- | ------ | ---- | --------------------- |
| `/api/submissions/:id/status` | GET    | USER | Get submission status |

## Plagiarism

| Endpoint                    | Method | Auth  | Description              |
| --------------------------- | ------ | ----- | ------------------------ |
| `/api/plagiarism/:id/confirm` | POST | ADMIN | Confirm a plagiarism report |

## Admin

| Endpoint                                 | Method | Auth  | Description                     |
| ---------------------------------------- | ------ | ----- | ------------------------------- |
| `/api/users`                             | GET    | ADMIN | List users                      |
| `/api/users/:id/role`                    | PUT    | ADMIN | Update user role                |
| `/api/admin/submissions`                 | GET    | ADMIN | List submissions                |
| `/api/admin/submissions/:id/rejudge`     | POST   | ADMIN | Rejudge a submission            |
| `/api/admin/problems/:id/rejudge`        | POST   | ADMIN | Bulk-rejudge a problem          |
| `/api/admin/rejudge-jobs`                | GET    | ADMIN | List rejudge jobs               |

## Worker (port 3002)

Endpoints exposed by the worker service, protected by the `x-worker-secret` header:

| Endpoint                                | Method | Auth   | Description                     |
| --------------------------------------- | ------ | ------ | ------------------------------- |
| `/api/worker/health`                    | GET    | -      | Worker health check             |
| `/api/worker/enqueue`                   | POST   | Secret | Enqueue code for execute        |
| `/api/worker/schedule-rating`           | POST   | Secret | Schedule rating calc job        |
| `/api/worker/schedule-phase-transition` | POST   | Secret | Schedule phase 1→2 job          |
| `/api/worker/schedule-freeze`           | POST   | Secret | Schedule leaderboard freeze job |

Backend endpoints called by the worker (also protected by `x-worker-secret`):

| Endpoint                                | Method | Auth   | Description                     |
| --------------------------------------- | ------ | ------ | ------------------------------- |
| `/api/worker/update-submission`         | POST   | Secret | Update submission result        |
| `/api/worker/update-plagiarism`         | POST   | Secret | Store plagiarism reports        |
| `/api/worker/transition-judge-phase`    | POST   | Secret | Transition phase 1→2            |

---

## Testing with curl

```bash
# Login to get session cookie (requires DEV_LOGIN_SECRET in the backend .env)
curl -c /tmp/algohaven-cookies.txt -X POST http://localhost:3001/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","secret":"<DEV_LOGIN_SECRET>"}'

# Submit solution (replace :problemId)
curl -X POST "http://localhost:3001/api/problems/:problemId/submission" \
  -H "Content-Type: application/json" \
  -b /tmp/algohaven-cookies.txt \
  -d '{"code":"console.log(1)","language":"javascript"}'

# Run against sample cases, then poll the result
curl -X POST "http://localhost:3001/api/problems/:problemId/run" \
  -H "Content-Type: application/json" \
  -b /tmp/algohaven-cookies.txt \
  -d '{"code":"console.log(1)","language":"javascript"}'
# → { runId: "run-..." } then:
curl "http://localhost:3001/api/runs/run-..." -b /tmp/algohaven-cookies.txt

# Check submission status (replace :submissionId)
curl "http://localhost:3001/api/submissions/:submissionId/status" -b /tmp/algohaven-cookies.txt

# Worker health
curl http://localhost:3002/api/worker/health

# Worker enqueue (direct, must send x-worker-secret)
curl -X POST http://localhost:3002/api/worker/enqueue \
  -H "Content-Type: application/json" \
  -H "x-worker-secret: <WORKER_SECRET>" \
  -d '{"code":"console.log(1+1)","language":"javascript","submissionId":"sub-test-1","testCases":[],"judgePhase":"PRACTICE","hasCustomChecker":false}'
```