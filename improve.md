Here's a summary of the main improvements I found:
Critical Issues

1. Zero test coverage - No tests exist anywhere in the codebase (no Jest, Vitest, Playwright, etc.)
2. SHA-256 password hashing (packages/auth/index.ts:14-28) - Should use bcrypt/argon2 instead; SHA-256 is too fast for password hashing
3. Hardcoded default DB credentials (docker-compose.yml:7-9) - postgres:postgres should be env-var driven
4. Weak default worker secret - "dev-secret-change-in-prod" in .env.example and code
   High Priority
5. strict: false in backend tsconfig (apps/be/tsconfig.json:29) - Disables all strict type checking
6. In-memory job queue (apps/worker/queue.ts:13) - All queued jobs lost on worker restart; needs Redis/BullMQ
7. Single-threaded worker - Processes submissions sequentially, will bottleneck under load
8. Widespread any types - ~15+ instances across route handlers and frontend
9. Debug code in production (apps/be/routes/submission.ts:126-129) - Returns test cases to client instead of creating submission
10. Duplicated worker code - index.ts and queue.ts have nearly identical processing logic
    Medium Priority
11. No rate limiting on auth endpoints
12. Missing Secure cookie flag (apps/be/routes/auth.ts:100)
13. No input validation library - Manual field checks everywhere; should use Zod
14. No pagination on /api/me and leaderboard endpoints
15. CORS not configurable via env var (apps/be/index.ts:130)
16. Unused packages/ui - Dead package not imported by any app
17. Go 1.21 image is past EOL (apps/worker/config.ts:9)
    Architecture
18. Custom router lacks request body limits, timeouts, structured logging, request IDs
19. No .env validation at startup
20. All logging uses console.log - No structured JSON logging
21. No CI/CD pipeline configured
