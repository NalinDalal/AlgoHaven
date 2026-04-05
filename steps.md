# AlgoHaven Development Roadmap

## Current Status

### Backend

- [x] Session-based authentication (password auth)
- [x] Session management with HttpOnly cookies
- [x] Problem endpoints (/api/problems/\*, /api/problem/create)
- [x] Problem update endpoint (PUT /api/problems/:id)
- [x] Problem delete endpoint (DELETE /api/problems/:id)
- [x] Contest endpoints (/api/contest/\*)
- [x] Contest update endpoint (PUT /api/contest/:id)
- [x] Contest delete endpoint (DELETE /api/contest/:id)
- [x] Submission endpoints
- [x] User profile endpoint (/api/me) with enhanced data
- [x] Admin auth middleware (requireAdmin)
- [x] Dev login endpoint (/api/auth/dev-login)
- [x] Beautified API responses (success/failure helpers)
- [x] Badge system
- [x] Streak tracking
- [x] Submission heatmap
- [x] Problem tags breakdown
- [x] Contest performance stats
- [x] Percentile ranking

### Frontend

- [x] Home page
- [x] Problems list page
- [x] Problem detail page with editor
- [x] Contests list page
- [x] Auth page (login/register)
- [x] Dev login page (/dev-login)
- [x] Admin layout with auth check
- [x] Admin dashboard (/admin)
- [x] Admin problem list view (/admin/problems)
- [x] Admin problem creation form (/admin/problems/new)
- [x] Admin problem edit form (/admin/problems/:id)
- [x] Admin contest list view (/admin/contests)
- [x] Admin contest creation form (/admin/contests/new)
- [x] Admin contest edit form (/admin/contests/:id)
- [x] User dashboard (/me) with circular stats
- [x] Submission heatmap
- [x] Badge display
- [x] Skeleton loaders
- [x] Fade-in animations

### Database

- [x] Prisma schema complete
- [x] All models defined (User, Problem, TestCase, Contest, etc.)
- [x] Migrations run
- [x] Performance indexes added

---

## Completed Features

### Authentication

- Password-based authentication (register/login/signout)
- Session cookies (HttpOnly, SameSite=Lax)
- Dev login bypass for testing (/dev-login)

### User Dashboard (/me)

- Circular stat cards with animated rings
- Difficulty breakdown (Easy/Medium/Hard)
- GitHub-style submission heatmap (365 days)
- Streak tracking (current + longest)
- Problem tags breakdown (top 10 tags)
- Achievement badges (13 badges)
- Contest performance stats
- Percentile ranking
- Recent submissions table

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

## Pending Features

### Todo

- [ ] Rating system (Elo calculation after contests)
- [ ] User management (make users admin from admin panel)

---

## Code Execution Service

### Worker Service (apps/worker/)

- Modular structure for easy debugging
- Runs on port 3002
- Endpoints:
  - POST /api/worker/enqueue - Add submission to queue (auth: x-worker-secret header)
  - GET /api/worker/health - Health check

### File Structure

```
apps/worker/
├── index.ts      # Main entry point
├── config.ts     # Language & Docker config
├── docker.ts    # Docker execution logic
├── queue.ts      # Job queue management
└── api.ts       # HTTP handlers
```

### Docker Sandbox

- Isolated containers with security options:
  - --cpus=0.5, --memory=256m
  - --network=none
  - --user=1000 (non-root)
  - --cap-drop=ALL
  - --security-opt=no-new-privileges
  - --pids-limit=50
  - --read-only (interpreted languages)
  - --tmpfs=/tmp:size=64m

### Supported Languages

| Language   | Docker Image           | Timeout |
| ---------- | ---------------------- | ------- |
| Python     | python:3.11-slim       | 5s      |
| JavaScript | node:20-slim           | 5s      |
| C++        | gcc:13.2.0             | 10s     |
| Java       | eclipse-temurin:21-jdk | 15s     |
| Go         | golang:1.21            | 10s     |

### Integration

- Backend sends submissions to worker via HTTP
- Worker uses base64 encoding to avoid shell escaping issues
- Worker updates submission status in DB via /api/worker/update-submission
- Protected by WORKER_SECRET env var

### Flow

```
User submits code -> Backend creates submission (QUEUED)
  ->
Sends to Worker via /api/worker/enqueue
  ->
Worker runs Docker container with code
  ->
Worker calls /api/worker/update-submission (ACCEPTED/WRONG_ANSWER/etc)
  ->
User polls /api/submissions/:id/status
```

---

## Testing Checklist

- [x] Dev login bypass (/dev-login)
- [x] Create problem via admin form
- [x] View problems list
- [x] Delete problem
- [x] Update problem
- [x] Create contest via admin form
- [x] View contests list
- [x] Delete contest
- [x] Update contest
- [x] Register new account
- [x] Login with password
- [x] User dashboard displays correctly
- [x] Submit solution (basic flow)
- [x] Check submission status
- [x] Docker code execution (Python)
- [x] Docker code execution (JavaScript)
- [x] Docker code execution (C++)
- [x] Docker code execution (Java)
- [x] Docker code execution (Go)
