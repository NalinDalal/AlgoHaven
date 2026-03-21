# AlgoHaven Development Roadmap

## Current Status ✅

- Database schema and migrations complete
- Backend API: auth, problems, contests, submissions (all endpoints exist)
- Magic link authentication working
- Frontend: basic pages (home, problems, contests, me, auth)

---

## Next: Admin Panel (Frontend)

### 1. Admin Dashboard

- `/admin` route with overview stats
- Links to problem/contest management

### 2. Problem Management UI

- Create problem form: title, slug, difficulty, statement (markdown), tags, time/memory limits
- Test case editor: add sample/hidden test cases (input/output pairs)
- Problem list view with edit/delete actions

### 3. Contest Management UI

- Create contest form: title, slug, start/end time, visibility, isRated, freezeTime
- Add problems to contest, set order and points
- Contest list view with edit/delete

---

## Future Features

### Code Execution Service

- Docker sandbox for running user code
- Worker service to judge submissions
- Queue system for async processing

### Contest Features

- Real-time leaderboard (WebSockets/Redis)
- Contest freeze/unfreeze
- Ratings calculation

### User Features

- Submission history
- Analytics (solved count, streaks, topic breakdown)
- Dark mode

### Advanced

- Rejudge functionality
- Plagiarism detection
- Virtual contests
