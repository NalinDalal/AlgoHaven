import { serve } from "bun";
import { config } from "dotenv";
import { be } from "@algohaven/logger";

/*
 Load environment variables from .env.
 MUST be called before importing anything that depends on env variables
 (like Prisma).
*/
config({ path: "../../.env" });

// Prisma client
import { prisma } from "@/packages/db";

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
} from "./routes/contest";

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
};

// -----------------------------------------------------------------------------
// CORS configuration
// -----------------------------------------------------------------------------

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cookie",
  "Access-Control-Allow-Credentials": "true",
};

// -----------------------------------------------------------------------------
// Main router
// -----------------------------------------------------------------------------

async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method.toUpperCase();

  // Handle preflight requests
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Iterate through route table
  for (const pattern of Object.keys(routes)) {
    const params = matchRoute(pattern, url.pathname);
    const routeObj = routes[pattern];
    if (params && routeObj && routeObj[method]) {
      // attach route params to request
      (req as any).params = params;
      try {
        const response = await routeObj[method](req);
        // Merge CORS headers into response
        const headers = new Headers(response.headers);
        for (const [k, v] of Object.entries(CORS_HEADERS)) {
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
            details: String(err),
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
