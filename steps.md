# AlgoHaven Development Roadmap

## 1. Admin Authentication & Authorization
- Implement admin login (magic link or password).
- Add middleware to check if a user is an admin for protected routes.
- Only admins can access endpoints for creating/editing problems, contests, and test cases.

## 2. Admin Panel Features
### a. Problem Management
- Admin UI to create, edit, and delete problems.
- Fields: title, slug, difficulty, statement (markdown), tags, time/memory limits, starter code (per language), editorial, visibility.
- Ability to add/edit/delete test cases (sample and hidden).
- Option to upload test cases in bulk (CSV/ZIP).

### b. Contest Management
- Admin UI to create, edit, and delete contests.
- Fields: title, slug, start/end time, visibility, isRated, freezeTime, registrationOpen.
- Add/remove problems to/from contests, set order and points per problem.
- Announcements: add/edit contest announcements.

### c. Rejudge & Plagiarism
- Trigger rejudge for a problem or contest.
- View and manage plagiarism reports.

## 3. API Endpoints
- Secure all admin endpoints (require admin role).
- Endpoints for:
  - POST/PUT/DELETE /problems
  - POST/PUT/DELETE /contests
  - POST/PUT/DELETE /testcases
  - POST /rejudge
  - GET/POST /plagiarism-reports

## 4. Frontend Admin Panel
- Build admin dashboard (separate route or section).
- Forms for problem/contest creation and editing.
- Table/list views for managing problems, contests, and test cases.
- UI for rejudge and plagiarism review.

## 5. Testing & Validation
- Add tests for admin-only access.
- Validate all required fields and error handling in forms and API.

---

## [6. Code Execution Service](./code-exec.md)

## 7. Contest Logic & Real-Time Features
- Wire up contest registration, start/end logic, and problem visibility.
- Implement real-time leaderboard (WebSockets or polling).
- Handle contest freeze/unfreeze and post-contest upsolve mode.
- Ensure submissions during contest are judged with correct phase/testcases.

## 8. Ratings & User Analytics
- Implement rating calculation and update after contests (Elo/Codeforces-style).
- Show user rating history, rank tier, and analytics (solved count, streaks, language stats).
- Display rating graph and contest performance on user profile.

## 9. Final Polish & Launch
- Add dark mode toggle and user preferences.
- Polish UI/UX for all user and admin flows.
- Add documentation and onboarding.
- Final security review and bugfixes.
- Prepare for deployment and launch.

---

**Next Steps:**
1. Finish admin authentication and panel.
2. Complete code execution service and integrate with submissions.
3. Build contest logic and real-time leaderboard.
4. Implement ratings and analytics.
5. Polish, test, and launch!
