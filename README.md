# AlgoHaven

Contest platform similar to Codeforces

---

## Auth

- Magic link (email-based) auth
- Session management

---

## Database Setup

Start Docker container:

```sh
docker run --name AlgoHaven \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=algohaven \
  -p 5432:5432 \
  -v algohaven_data:/var/lib/postgresql/data \
  -d postgres:16
```

```sh
bunx prisma migrate dev
```

---

## Features

### 1. Code Submission History

- `submissions` table: `id`, `user_id`, `question_id`, `code`, `language`, `status`, `verdict`, `execution_time_ms`, `memory_used_kb`, `created_at`
- Verdict types: `AC` (Accepted), `WA` (Wrong Answer), `TLE` (Time Limit Exceeded), `MLE` (Memory Limit Exceeded), `RE` (Runtime Error), `CE` (Compile Error)
- API endpoint to fetch user submission history per question
- Frontend:
  - "Submission History" tab on question detail page
  - List past submissions with verdict, runtime, and memory stats

---

### 2. Admin Panel

#### Question Management

- Rich markdown editor with LaTeX support for problem statements
- Difficulty tags (`Easy`, `Medium`, `Hard`) and topic tags (DP, Graphs, Trees, etc.)
- Starter code templates per supported language (Python, C++, Java, JavaScript)
- Public sample test cases + hidden test cases (only run on final submission)
- Per-problem time limit (`time_limit_ms`) and memory limit (`memory_limit_mb`)
- Editorial / solution writeup — published after contest ends
- Problem versioning to prevent edits from breaking live submissions
- "Validate" button — runs admin's reference solution against all test cases

#### Test Case Management

- `test_cases` table: `id`, `problem_id`, `input`, `expected_output`, `is_sample`, `points`
- Bulk upload test cases via CSV or ZIP
- Custom checker support for problems with multiple valid outputs

#### Contest Management

- `contests` table: `id`, `name`, `start_time (UTC)`, `end_time`, `visibility` (`public` / `invite` / `private`)
- `contest_problems` join table: `contest_id`, `problem_id`, `points`, `order`
- Configurable leaderboard freeze (e.g. hide rankings in final 30 min, Codeforces-style)
- In-contest announcement / broadcast system
- Pre-contest practice mode (same problems, no leaderboard effect)
- Admin-triggered rejudge: re-run all submissions for a problem if a test case was wrong
- `rejudge_jobs` table to track batch rejudge status

---

### 3. Contest Mode (User-Facing)

#### Scoring

- Points per problem set by admin
- Time penalty: +5 min per wrong submission on a solved problem
- Tie-breaking: total points → finish time → fewest wrong attempts
- Optional first-solve bonus for whoever solves a problem first
- Partial scoring: award partial points for passing a subset of test cases (subtasks)
- Per-language time limits (e.g. C++ = 1s, Python = 3s for the same problem)

#### Leaderboard

- Real-time leaderboard via WebSockets
- Redis Sorted Set (ZSET) for O(log n) score updates and top-N queries
- Composite score stored as single value: `points * BIG_MULTIPLIER - finish_time_seconds`
- Leaderboard freeze: rankings hidden from users in final N minutes, unfrozen after contest ends
- Top 50 shown live; full standings accessible post-contest
- `contest_submissions` table to track all submissions made during a contest

#### Frontend

- "Contests" page: upcoming, live, and past contests
- Countdown timer for upcoming contests
- Monaco editor with syntax highlighting and language selection
- Real-time leaderboard panel during contest

---

### 4. Post-Contest

- Editorial unlock after contest ends
- Upsolve mode: accept submissions after deadline (no ranking effect)
- Leaderboard unfreeze ceremony showing final standings
- Rating system (Elo / Codeforces-style): `user_ratings` table with `user_id`, `rating`, `updated_at`
- Virtual contests: replay any past contest solo against the clock

---

### 5. Analytics for Users

- Track: questions solved, time taken, verdicts breakdown, topics attempted
- API endpoints for analytics data
- Frontend "Analytics" section in user profile:
  - Average solve time
  - Strong/weak topic breakdown
  - Percentile ranking among all users
  - Submission heatmap (GitHub-style)

---

### 6. Dark Mode

- Tailwind CSS dark mode toggle
- Preference saved in DB per user

---

### 7. Plagiarism Detection _(Important)_

- Integrate **Moss** or custom token-similarity solution
- Compare submissions within the same contest for a given problem
- `plagiarism_reports` table: flagged pairs, similarity score, admin review status
- Notify users if submission is flagged
- Admin dashboard to review and act on flagged submissions

---

### 8. Docker-based Code Execution

#### Architecture

- Submissions → Message Queue → Code Execution Workers (Docker containers)
- Async result retrieval: return `submission_id` immediately, client polls `GET /submissions/:id/status`
- Two-phase processing for high-load contests:
  - **Phase 1 (during contest)**: run against ~10% of test cases for immediate feedback
  - **Phase 2 (post-deadline)**: run against all test cases for official results

#### Security

```sh
docker run \
  --cpus="0.5" \
  --memory="512M" \
  --cap-drop="ALL" \
  --network="none" \
  --read-only \
  ...
```

- Each submission runs in a fresh container, destroyed after execution
- `seccomp` profile to restrict syscalls
- Non-root user inside containers
- No network access

#### Scaling

- Pre-scale worker pool before contest start to avoid cold-start lag
- Kubernetes or Docker Swarm for managing workers under load

---

## Schema Overview

| Table                 | Key Fields                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `users`               | `id`, `email`, `rating`, `created_at`                                                                                    |
| `problems`            | `id`, `title`, `description`, `difficulty`, `time_limit_ms`, `memory_limit_mb`, `editorial`, `checker_code`, `is_public` |
| `test_cases`          | `id`, `problem_id`, `input`, `expected_output`, `is_sample`, `points`                                                    |
| `contests`            | `id`, `name`, `start_time`, `end_time`, `visibility`, `leaderboard_freeze_at`                                            |
| `contest_problems`    | `contest_id`, `problem_id`, `points`, `order`                                                                            |
| `submissions`         | `id`, `user_id`, `problem_id`, `code`, `language`, `verdict`, `execution_time_ms`, `memory_used_kb`, `created_at`        |
| `contest_submissions` | `id`, `submission_id`, `contest_id`, `wrong_attempts`, `solved_at`                                                       |
| `user_ratings`        | `user_id`, `rating`, `updated_at`                                                                                        |
| `plagiarism_reports`  | `id`, `submission_a_id`, `submission_b_id`, `similarity_score`, `reviewed_by`, `status`                                  |
| `rejudge_jobs`        | `id`, `problem_id`, `triggered_by`, `status`, `created_at`                                                               |

---

## To Do

- [ ] Contest list page
- [ ] Problem list page - BE Done
- [ ] Submission flow (editor → judge → verdict)
- [ ] User dashboard & analytics
- [ ] Admin panel (problem + contest creation, test case upload)
- [ ] Real-time leaderboard (WebSockets + Redis ZSET)
- [ ] Docker execution sandbox
- [ ] Rating system post-contest
- [ ] Plagiarism detection
- [ ] Virtual contests

---

[system design](./design.md)

