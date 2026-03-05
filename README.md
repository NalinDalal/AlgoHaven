# AlgoHaven
Contest platform similar to codeforces



#### 1. Code Submission History
- Create a `submissions` table in the database with fields:
  - `id`, `user_id`, `question_id`, `code`, `status`, `execution_time`, `created_at`.
- Add an API endpoint to fetch a user's submission history for a question.
- Frontend:
  - Add a "Submission History" tab on the question detail page.
  - Display a list of past submissions with details.


we will do auth based on email link(magic link)


#### 2. Contest Mode
- Backend:
  - Create a `contests` table with fields:
    - `id`, `name`, `start_time(UTC)`, `end_time`, `questions`.
  - Add a `contest_submissions` table to track submissions during contests.
  - Escalate based on a point system
  - Implement real-time leaderboards using WebSockets.
- Frontend:
  - Add a "Contests" section where users can view upcoming and ongoing contests.
  - Show a countdown timer for contests.
  - Display the leaderboard in real-time.

#### 3. Analytics for Users
- Backend:
  - Track user activity (e.g., questions solved, time taken).
  - Create endpoints to fetch analytics data.
- Frontend:
  - Add an "Analytics" section in the user profile.
  - Display:
    - Average time to solve questions.
    - Strong/weak topics.
    - Percentile ranking.

#### 5. Dark Mode
- Frontend:
  - Use a CSS-in-JS library or Tailwind CSS to implement dark mode.
  - Add a toggle button to switch between light and dark modes.
  - Save the user's preference in local storage or the database.

#### 6. Plagiarism Detection (Very Important)
- Backend:
  - Integrate a plagiarism detection tool like **Moss** or build a custom solution.
  - Compare submissions for similarity and flag suspicious ones.
  - Store plagiarism reports in the database.
- Frontend:
  - Notify users if their submission is flagged for plagiarism.
  - Add a section for admins to review flagged submissions.

#### 7. Docker-based Code Execution
- Use Docker containers to run user-submitted code in a secure, isolated environment.
- Create lightweight Docker images for each supported language (e.g., Python, JavaScript, C++).
- Backend:
  - Spin up a Docker container for each code execution.
  - Mount the user's code and test cases into the container.
  - Capture the output and return it to the user.
  - Destroy the container after execution.
- Security:
  - Restrict CPU and memory usage for each container.
  - Set timeouts to kill long-running containers.
  - Run containers as non-root users.
  - Disable network access inside containers.
- Scaling:
  - Use Kubernetes or Docker Swarm to manage and scale containers based on load.

-------

start docker container:
```sh
docker run --name AlgoHaven \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  -v algohaven_data:/var/lib/postgresql/data \
  -d postgres:16
```

## ZenStack

- Schema location: `packages/db/zenstack/schema.zmodel`
- Generate client artifacts:

```sh
bun run zen:generate
```

- Push schema to database:

```sh
bun run zen:db:push
```

------

to do:
Wire landing page CTA to auth: connect “Get Started” to magic-link request and add a simple email form.
Add FE auth flow: store login state from /api/auth/me, add logout, and redirect after verify success.
Protect backend routes: add a small auth guard utility and apply it to private endpoints.
Harden auth security: rate-limit request-link endpoint, add IP/email throttling, and clean up expired tokens/sessions via a cron/task.
Improve DX: update Turbo config so dev includes fe explicitly and avoid warnings for BE build outputs.
Ship observability: add request logging + basic error tracking so auth failures are visible quickly.
Then build product features: contest list page, problem list page, submission flow, and user dashboard analytics.