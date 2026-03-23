# AlgoHaven Development Roadmap

## Current Status ✅

### Backend

- [x] Magic link authentication (`/api/auth/*`)
- [x] Session management with HttpOnly cookies
- [x] Problem endpoints (`/api/problems/*`, `/api/problem/create`)
- [x] Problem delete endpoint (`DELETE /api/problems/:id`)
- [x] Contest delete endpoint (`DELETE /api/contest/:id`)
- [x] Contest update endpoint (`PUT /api/contest/:id`)
- [x] Contest endpoints (`/api/contest/*`)
- [x] Submission endpoints
- [x] Admin auth middleware (`requireAdmin`)
- [x] Dev login endpoint (`/api/auth/dev-login`)
- [x] Beautified API responses (`success/failure` helpers)

### Frontend

- [x] Home page
- [x] Problems list page
- [x] Contests list page
- [x] Auth page (magic link request)
- [x] Auth verify page (token verification)
- [x] Dev login page (`/dev-login`)
- [x] Admin layout with auth check
- [x] Admin dashboard (`/admin`)
- [x] Admin problem list view (`/admin/problems`)
- [x] Admin problem creation form (`/admin/problems/new`)
- [x] Admin contest list view (`/admin/contests`)
- [x] Admin contest creation form (`/admin/contests/new`)
- [x] Contest delete button in list view

### Database

- [x] Prisma schema complete
- [x] All models defined (User, Problem, TestCase, Contest, etc.)
- [x] Migrations run

---

## Completed Features

### Admin Panel

- Dashboard with links to Problems, Contests, Submissions, Users
- Auth check in layout (redirects non-admins)
- Problem list view with:
  - Title, slug, difficulty badges
  - Public/Hidden status
  - Test case count
  - Edit/Delete actions
- Problem creation form with:
  - Title, slug, difficulty, statement (markdown)
  - Tags, time/memory limits
  - Test case editor (add/remove, sample/hidden)
- Contest creation form with:
  - Title, slug, start/end times
  - Visibility, rated, practice, freeze time
  - Registration toggle

### Authentication

- Magic link flow: request → email → verify → session
- Session cookies (HttpOnly, SameSite=Strict)
- Dev login bypass for testing (`/dev-login`)

### API Response Format

```typescript
// Success
success("Operation completed", { data }, 200)

// Failure
failure("Error message", null, 400)

// Response shape
{
  status: "success" | "error",
  message: string,
  data: T | null,
  error: string | null,
  timestamp: string
}
```

---

## Next: Admin Panel - In Progress

### Still Needed

- [ ] User management (make users admin)
- [ ] Problem editor (edit existing problems)
- [ ] Contest editor (edit existing contests)

---

## Completed: Code Execution Service ✅

### Worker Service

- Runs on port 3002
- Endpoints:
  - `POST /api/worker/enqueue` - Add submission to queue
  - `GET /api/worker/health` - Health check

### Docker Sandbox

- Isolated containers with security options:
  - `--cpus=0.5`, `--memory=256m`
  - `--network=none`
  - `--user=1000` (non-root)
  - `--cap-drop=ALL`
  - `--security-opt=no-new-privileges`
  - `--pids-limit=50`

### Supported Languages

- Python (`python:3.11-slim`)
- JavaScript (`node:20-slim`)

### Integration

- Backend sends submissions to worker via HTTP
- Worker uses base64 encoding to avoid shell escaping issues
- Worker updates submission status in DB via `/api/worker/update-submission`
- Protected by `WORKER_SECRET` env var

### Env Vars Added

```env
WORKER_SECRET="dev-secret-change-in-prod"
WORKER_URL="http://localhost:3002"
BACKEND_URL="http://localhost:3001"
```

### Flow

```
User submits code → Backend creates submission (QUEUED)
  ↓
Sends to Worker via /api/worker/enqueue
  ↓
Worker runs Docker container with code
  ↓
Worker calls /api/worker/update-submission (ACCEPTED/WRONG_ANSWER/etc)
  ↓
User polls /api/submissions/:id/status
```

---

## Future Features

### Todo

- [ ] Add more languages (C++, Java, Go) to worker
- [ ] User management (make users admin from admin panel)
- [ ] Problem editor (edit existing problems)
- [ ] Contest editor (edit existing contests)
- [ ] Frontend code submission page with Monaco editor
- [ ] Real-time leaderboard (WebSockets + Redis)
- [ ] Rating system

### Additional Features

- Real-time leaderboard (WebSockets + Redis ZSET)
- Two-phase evaluation (during contest / post-deadline)
- Contest freeze/unfreeze
- Ratings calculation

### User Features

- User dashboard & analytics
- Submission history with verdict breakdown
- Topic/skill breakdown
- Rating history graph

### Advanced

- Rejudge functionality
- Plagiarism detection (Moss/token-similarity)
- Virtual contests (replay past contests solo)

---

## Testing Checklist

- [x] Dev login bypass (`/dev-login`)
- [x] Create problem via admin form
- [x] View problems list
- [x] Delete problem
- [x] Create contest via admin form
- [x] View contests list
- [x] Delete contest
- [ ] Magic link flow (request → email link → verify → logged in)
- [x] Submit solution (basic flow)
- [x] Check submission status
- [x] Docker code execution (Python)
- [x] Docker code execution (JavaScript)
