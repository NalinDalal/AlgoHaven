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

## Future Features

### Code Execution Service 🔜

- Docker sandbox for running user code
- Worker service to judge submissions
- Queue system for async processing

### Contest Features

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
- [ ] Create problem via admin form
- [ ] View problems list
- [ ] Delete problem
- [ ] Create contest via admin form
- [ ] View contests list
- [ ] Delete contest
- [ ] Magic link flow (request → email link → verify → logged in)
- [ ] Submit solution (basic flow)
- [ ] Check submission status
