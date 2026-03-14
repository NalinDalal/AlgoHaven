import { serve } from "bun";
import { config } from "dotenv";

/*
 Load environment variables from .env.
 MUST be called before importing anything that depends on env variables
 (like Prisma).
*/
config();

// Debug log to verify env is loaded
console.log("DEBUG DATABASE_URL:", process.env.DATABASE_URL);

// Prisma client
import { prisma } from "@/packages/db";

// Route handlers
import {
  handleRequestMagicLink,
  handleVerifyMagicLink,
  handleSignout,
  handleMe
} from "./routes/auth";

import {
  handleProblemsList,
  handleProblemDetail
} from "./routes/problem";

import {
  handleSubmitSolution,
  handleSubmissionStatus
} from "./routes/submission";

import {
  listContest,
  getContestDetails,
  registerForContest,
  unregisterFromContest,
  listContestProblems,
  listContestProblemById,
  submitContestProblemSolution,
  createContest
} from "./routes/contest";


// -----------------------------------------------------------------------------
// Route handler type
// -----------------------------------------------------------------------------

type Handler = (req: Request) => Promise<Response> | Response;


// -----------------------------------------------------------------------------
// Route table
// Maps URL patterns to handlers
// -----------------------------------------------------------------------------

const routes: Record<string, Record<string, Handler>> = {

  // ---------------- AUTH ----------------

  "/api/auth/magic-link": { POST: handleRequestMagicLink },
  "/api/auth/verify": { GET: handleVerifyMagicLink },
  "/api/auth/signout": { POST: handleSignout },
  "/api/auth/me": { GET: handleMe },


  // ---------------- PROBLEMS ----------------

  "/api/problems": { GET: handleProblemsList },
  "/api/problems/:id": { GET: handleProblemDetail },
  "/api/problems/:id/submission": { POST: handleSubmitSolution },


  // ---------------- SUBMISSIONS ----------------

  "/api/submissions/:id/status": { GET: handleSubmissionStatus },


  // ---------------- CONTEST ----------------
  // NOTE: Static routes MUST come before dynamic routes.

  "/api/contest": { GET: listContest },
  "/api/contest/create": { POST: createContest },
  "/api/contest/:id": { GET: getContestDetails },
  "/api/contest/:id/register": { POST: registerForContest },
  "/api/contest/:id/unregister": { POST: unregisterFromContest },
  "/api/contest/:id/problems": { GET: listContestProblems },

  "/api/contest/:id/problems/:problemId": {
    GET: listContestProblemById,
    POST: submitContestProblemSolution
  },
};


// -----------------------------------------------------------------------------
// Route pattern matcher
// Example:
// pattern: /api/problems/:id
// path:    /api/problems/abc123
// result:  { id: "abc123" }
// -----------------------------------------------------------------------------

function matchRoute(pattern: string, pathname: string): Record<string, string> | null {

  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {

    // dynamic param (:id)
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    }

    // static segment mismatch
    else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}


// -----------------------------------------------------------------------------
// CORS configuration
// -----------------------------------------------------------------------------

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_BE_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

    if (params && routes[pattern][method]) {

      // attach route params to request
      (req as any).params = params;

      try {

        const response = await routes[pattern][method](req);

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
          headers
        });

      } catch (err) {
  console.error("ROUTE ERROR:", err);

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      details: String(err)
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS
      }
    }
  );
}
    }
  }

  // No route matched
  return new Response(
    JSON.stringify({ error: "Not Found" }),
    {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS
      }
    }
  );
}


// -----------------------------------------------------------------------------
// Start server
// -----------------------------------------------------------------------------

const PORT = parseInt(process.env.BE_PORT || "3001");

serve({
  port: PORT,
  fetch: router
});

console.log(`Backend running on http://localhost:${PORT}`);