Here's a summary of the main improvements I found:
Critical Issues

1. Zero test coverage - No tests exist anywhere in the codebase (no Jest, Vitest, Playwright, etc.)
2. Hardcoded default DB credentials (docker-compose.yml:7-9) - postgres:postgres should be env-var driven
3. Weak default worker secret - "dev-secret-change-in-prod" in .env.example and code
   High Priority
4. Single-threaded worker - Processes submissions sequentially, will bottleneck under load
5. Widespread any types - ~15+ instances across route handlers and frontend
6. Debug code in production (apps/be/routes/submission.ts:126-129) - Returns test cases to client instead of creating submission
7. Duplicated worker code - index.ts and queue.ts have nearly identical processing logic
   Medium Priority
8. No rate limiting on auth endpoints
9. Missing Secure cookie flag (apps/be/routes/auth.ts:100)
10. No input validation library - Manual field checks everywhere; should use Zod
11. No pagination on /api/me and leaderboard endpoints
12. CORS not configurable via env var (apps/be/index.ts:130)
13. Unused packages/ui - Dead package not imported by any app
14. Go 1.21 image is past EOL (apps/worker/config.ts:9)
    Architecture
15. Custom router lacks request body limits, timeouts, structured logging, request IDs
16. No .env validation at startup
17. All logging uses console.log - No structured JSON logging
18. No CI/CD pipeline configured
