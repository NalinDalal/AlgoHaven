import { serve } from "bun";
import { config } from "dotenv";
import { be } from "@algohaven/logger";
import { validateEnv } from "@algohaven/utils";

/*
 Load environment variables from .env.
 MUST be called before importing anything that depends on env variables
 (like Prisma).
*/
config({ path: "../../.env" });

validateEnv(
  {
    DATABASE_URL: { required: true },
    WORKER_SECRET: { required: true },
    WORKER_URL: { required: true },
    CORS_ALLOWED_ORIGINS: { required: false, default: "http://localhost:3000" },
  },
  "Backend",
);

// Prisma client
// Keep the workspace package name here so Bun resolves the installed package,
// not a tsconfig-only alias.
import { prisma } from "@algohaven/db";

// Route handlers
import {
  handleLogin,
  handleRegister,
  handleSignout,
  handleMe as handleAuthMe,
  handleDevLogin,
  handleUpdateUserRole,
  handleListUsers,
} from "./routes/auth";

import { handleMe } from "./routes/me";

import {
  handleProblemsList,
  handleProblemDetail,
  handleProblemCreate,
  handleProblemDelete,
  handleProblemUpdate,
} from "./routes/problem";

import {
  handleSubmitSolution,
  handleSubmissionStatus,
  handleWorkerUpdateSubmission,
  handleWorkerUpdatePlagiarism,
  handleRunSolution,
} from "./routes/submission";

import {
  listContest,
  getContestDetails,
  registerForContest,
  unregisterFromContest,
  listContestProblems,
  listContestProblemById,
  submitContestProblemSolution,
  createContest,
  deleteContest,
  updateContest,
  getContestLeaderboard,
  getContestRatings,
  listContestAnnouncements,
  postContestAnnouncement,
  getContestSubmissions,
} from "./routes/contest";

import { handleCalculateRatings } from "./routes/ratings";
import { handleConfirmPlagiarism } from "./routes/plagiarism";
import { handleGetProfile } from "./routes/profile";
import {
  handleAdminListSubmissions,
  handleAdminRejudgeSubmission,
} from "./routes/admin";
import { matchRoute } from "@algohaven/utils";

// pattern: /api/problems/:id
// path:    /api/problems/abc123
// result:  { id: "abc123" }

// Route handler type
type Handler = (req: Request) => Promise<Response> | Response;

// -----------------------------------------------------------------------------
// Route table
// Maps URL patterns to handlers
// -----------------------------------------------------------------------------

const routes: Record<string, Record<string, Handler>> = {
  // ---------------- AUTH ----------------

  "/api/auth/login": { POST: handleLogin },
  "/api/auth/register": { POST: handleRegister },
  "/api/auth/signout": { POST: handleSignout },
  "/api/auth/me": { GET: handleAuthMe },
  "/api/me": { GET: handleMe },
  "/api/auth/dev-login": { POST: handleDevLogin },
  "/api/profile/:username": { GET: handleGetProfile },

  // ---------------- USERS (ADMIN) ----------------
  "/api/users": { GET: handleListUsers },
  "/api/users/:id/role": { PUT: handleUpdateUserRole },

  // ---------------- PROBLEMS ----------------
  // Problem CRUD operations
  // - GET /api/problems - List all problems (paginated)
  // - GET /api/problems/:id - Get problem details (admin gets full data, public gets limited)
  // - PUT /api/problems/:id - Update problem (admin only)
  // - DELETE /api/problems/:id - Delete problem (admin only)

  "/api/problems": { GET: handleProblemsList },
  "/api/problems/:id": {
    GET: handleProblemDetail,
    PUT: handleProblemUpdate,
    DELETE: handleProblemDelete,
  },
  "/api/problems/:id/submission": { POST: handleSubmitSolution },
  "/api/problems/:id/run": { POST: handleRunSolution },

  // ---------------- CREATE PROBLEM ----------------
  // POST /api/problem/create - Create new problem (admin only)

  "/api/problem/create": { POST: handleProblemCreate },

  // ---------------- SUBMISSIONS ----------------
  "/api/submissions/:id/status": { GET: handleSubmissionStatus },

  // ---------------- WORKER ----------------
  "/api/worker/update-submission": { POST: handleWorkerUpdateSubmission },

  // ---------------- CONTEST ----------------
  // NOTE: Static routes MUST come before dynamic routes.
  "/api/contest": { GET: listContest },
  "/api/contest/create": { POST: createContest },
  "/api/contest/:id": {
    GET: getContestDetails,
    DELETE: deleteContest,
    PUT: updateContest,
  },
  "/api/contest/:id/register": { POST: registerForContest },
  "/api/contest/:id/unregister": { POST: unregisterFromContest },
  "/api/contest/:id/problems": { GET: listContestProblems },

  "/api/contest/:id/problems/:problemId": {
    GET: listContestProblemById,
    POST: submitContestProblemSolution,
  },
  "/api/contest/:id/leaderboard": { GET: getContestLeaderboard },
  "/api/contest/:id/ratings": { GET: getContestRatings },
  "/api/contest/:id/announcements": {
    GET: listContestAnnouncements,
    POST: postContestAnnouncement,
  },
  "/api/contest/:id/calculate-ratings": { POST: handleCalculateRatings },
  "/api/contest/:id/submissions": { GET: getContestSubmissions },
  "/api/worker/update-plagiarism": { POST: handleWorkerUpdatePlagiarism },
  "/api/plagiarism/:id/confirm": { POST: handleConfirmPlagiarism },

  // ---------------- ADMIN SUBMISSIONS ----------------
  "/api/admin/submissions": { GET: handleAdminListSubmissions },
  "/api/admin/submissions/:id/rejudge": { POST: handleAdminRejudgeSubmission },
};

// -----------------------------------------------------------------------------
// CORS configuration
// -----------------------------------------------------------------------------

const CORS_ORIGIN =
  process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": CORS_ORIGIN,
  "Access-Control-Allow-Methods":
    process.env.CORS_ALLOWED_METHODS || "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    process.env.CORS_ALLOWED_HEADERS || "Content-Type, Cookie, X-Requested-By",
  "Access-Control-Allow-Credentials":
    process.env.CORS_ALLOW_CREDENTIALS?.toLowerCase() === "false"
      ? "false"
      : "true",
};

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "0",
};

// -----------------------------------------------------------------------------
// Main router
// -----------------------------------------------------------------------------

async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method.toUpperCase();

  // Handle preflight requests
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...CORS_HEADERS, ...SECURITY_HEADERS } });
  }

  // CSRF protection: non-GET/HEAD requests with cookie auth must have X-Requested-By
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const hasCookie = req.headers.get("cookie") !== null;
    const hasAuthHeader = req.headers.get("authorization") !== null;
    const requestedBy = req.headers.get("x-requested-by");
    if (hasCookie && !hasAuthHeader && !requestedBy) {
      return new Response(JSON.stringify({ error: "CSRF validation failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS },
      });
    }
  }

  // Iterate through route table
  for (const pattern of Object.keys(routes)) {
    const params = matchRoute(pattern, url.pathname);
    const routeObj = routes[pattern];
    if (params && routeObj && routeObj[method]) {
      // attach route params to request
      (req as { params?: Record<string, string> }).params = params;
      try {
        const response = await routeObj[method](req);
        // Merge CORS + security headers into response
        const headers = new Headers(response.headers);
        for (const [k, v] of Object.entries(CORS_HEADERS)) {
          headers.set(k, v);
        }
        for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
          headers.set(k, v);
        }
        /*
                  IMPORTANT:
                  We read response body as text first.
                  Reusing response.body stream directly can break in Bun.
                */
        const body = await response.text();

        return new Response(body, {
          status: response.status,
          headers,
        });
      } catch (err) {
        be.error(err, "Route error");

        return new Response(
          JSON.stringify({
            error: "Internal Server Error",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...CORS_HEADERS,
            },
          },
        );
      }
    }
  }

  // No route matched
  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...SECURITY_HEADERS,
    },
  });
}

// -----------------------------------------------------------------------------
// Start server
// -----------------------------------------------------------------------------

const PORT = parseInt(process.env.BE_PORT || "3001");

const server = serve({
  port: PORT,
  fetch: router,
});

be.info({ port: PORT }, "Backend running");

// -----------------------------------------------------------------------------
// Graceful shutdown
// -----------------------------------------------------------------------------

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  be.info({ signal }, "Shutting down gracefully");

  server.stop();

  await prisma.$disconnect();

  be.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
