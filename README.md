# AlgoHaven

Contest platform similar to Codeforces

---

## Quick Start

### 1. Start Database (Docker)

```sh
docker run --name AlgoHaven \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=algohaven \
  -p 5432:5432 \
  -v algohaven_data:/var/lib/postgresql/data \
  -d postgres:16
```

### 2. Run Migrations

```sh
bunx prisma migrate dev --schema=packages/db/prisma/schema.prisma
```

### 3. Start Development

```sh
bun run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### 4. Dev Login (Testing)

For quick testing without email:

```
http://localhost:3000/dev-login
```

---

## Auth

- Magic link (email-based) auth
- Session management with HttpOnly cookies
- Role-based access (USER/ADMIN)

### API Endpoints

| Endpoint               | Method | Description                  |
| ---------------------- | ------ | ---------------------------- |
| `/api/auth/magic-link` | POST   | Request magic link           |
| `/api/auth/verify`     | GET    | Verify token, create session |
| `/api/auth/signout`    | POST   | Sign out                     |
| `/api/auth/me`         | GET    | Get current user             |
| `/api/auth/dev-login`  | POST   | Dev-only quick login         |

### Response Format

All API responses use consistent format:

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

## Database Schema

### Prisma Models

| Model              | Key Fields                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `User`             | `id`, `email`, `role` (USER/ADMIN), `username`                                           |
| `Session`          | `id`, `tokenHash`, `userId`, `expiresAt`                                                 |
| `MagicLinkToken`   | `id`, `email`, `tokenHash`, `expiresAt`                                                  |
| `Problem`          | `id`, `title`, `slug`, `difficulty`, `statement`, `tags`, `timeLimitMs`, `memoryLimitKb` |
| `TestCase`         | `id`, `problemId`, `input`, `expectedOutput`, `isSample`, `points`                       |
| `Contest`          | `id`, `title`, `slug`, `startTime`, `endTime`, `visibility`, `isRated`, `freezeTime`     |
| `ContestProblem`   | `id`, `contestId`, `problemId`, `index`, `points`                                        |
| `Submission`       | `id`, `userId`, `problemId`, `contestId`, `code`, `language`, `status`                   |
| `LeaderboardEntry` | `id`, `contestId`, `userId`, `totalPoints`, `solved`, `penaltyMins`                      |
| `UserRating`       | `id`, `userId`, `contestId`, `ratingBefore`, `ratingAfter`, `rank`                       |
| `PlagiarismReport` | `id`, `submissionId`, `similarityScore`, `status`                                        |
| `RejudgeJob`       | `id`, `problemId`, `contestId`, `status`                                                 |

### Enums

- **Role**: `USER`, `ADMIN`
- **Difficulty**: `EASY`, `MEDIUM`, `HARD`
- **ContestVisibility**: `PUBLIC`, `INVITE`, `PRIVATE`
- **SubmissionStatus**: `QUEUED`, `RUNNING`, `ACCEPTED`, `WRONG_ANSWER`, `TLE`, `MLE`, `RUNTIME_ERROR`, `COMPILE_ERROR`
- **JudgePhase**: `PRACTICE`, `CONTEST_PHASE1`, `CONTEST_PHASE2`

---

## Test Case Storage

Test cases are stored as **relational rows** (NOT JSON):

```prisma
model TestCase {
  id             String  @id @default(uuid())
  problemId      String
  input          String
  expectedOutput String
  isSample       Boolean @default(false)
  points         Int     @default(0)
}
```

**Benefits:**

- Easy add/edit/delete of individual test cases
- Query hidden vs sample test cases via `isSample` field
- Index on `problemId` for fast lookups
- Per-test-case scoring (for partial credit)

---

## API Endpoints

### Problems

| Endpoint                       | Method | Auth  | Description         |
| ------------------------------ | ------ | ----- | ------------------- |
| `/api/problems`                | GET    | -     | List problems       |
| `/api/problems/:id`            | GET    | -     | Get problem details |
| `/api/problem/create`          | POST   | ADMIN | Create problem      |
| `/api/problems/:id/submission` | POST   | USER  | Submit solution     |

### Contests

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

### Submissions

| Endpoint                      | Method | Auth | Description           |
| ----------------------------- | ------ | ---- | --------------------- |
| `/api/submissions/:id/status` | GET    | USER | Get submission status |

---

## Features

### Completed ✅

- [x] Magic link authentication
- [x] Session management
- [x] Problem CRUD (backend + frontend)
- [x] Problem delete endpoint
- [x] Contest CRUD (backend)
- [x] Submission handling
- [x] Leaderboard (basic)
- [x] User ratings (basic)
- [x] Admin auth middleware
- [x] Admin dashboard (frontend)
- [x] Admin problem list view
- [x] Admin contest list view
- [x] Problem creation form
- [x] Contest creation form
- [x] Beautified API responses

### In Progress 🚧

- [ ] User management (make users admin)
- [ ] Problem/contest edit functionality

### Todo 📋

- [ ] Docker code execution sandbox
- [ ] Real-time leaderboard (WebSockets + Redis)
- [ ] User dashboard & analytics
- [ ] Rating system post-contest
- [ ] Plagiarism detection
- [ ] Virtual contests

---

## Architecture

```
Client (Next.js)
    ↓ HTTP
Backend (Bun/Hono)
    ↓ Prisma
PostgreSQL
```

### Future Architecture (planned)

```
Client → Load Balancer → Backend → PostgreSQL
                          ↓
                    Message Queue
                          ↓
               Code Execution Workers (Docker)
```

---

[System Design](./design.md)
