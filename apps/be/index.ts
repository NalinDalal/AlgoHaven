import { serve } from "bun";
import { config } from "dotenv";
import { join } from "path";

import {handleRequestMagicLink, handleVerifyMagicLink, handleSignout, handleMe} from './routes/auth';
import {handleProblemsList, handleProblemDetail} from './routes/problem';
import {handleSubmitSolution, handleSubmissionStatus} from './routes/submission';
type Handler = (req: Request) => Promise<Response> | Response;

const routes: Record<string, Record<string, Handler>> = {
  "/api/auth/magic-link": { POST: handleRequestMagicLink },
  "/api/auth/verify":     { GET: handleVerifyMagicLink  },
  "/api/auth/signout":    { POST: handleSignout         },
  "/api/auth/me":         { GET: handleMe               },

  // Problems
  "/api/problems":        { GET: handleProblemsList     },
  "/api/problems/:id":    { GET: handleProblemDetail    },

  // Submissions
  "/api/problems/:id/submission": { POST: handleSubmitSolution },
  "/api/submissions/:id/status":   { GET: handleSubmissionStatus },
}


async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method.toUpperCase();
  const route = routes[url.pathname];
  if (route && route[method]) {
    try {
      return await route[method](req);
    } catch (err) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
  return new Response("Not Found", { status: 404 });
}

config({ path: join(process.cwd(), "../../.env") });

const PORT = parseInt(process.env.PORT || "3001");

serve({
  port: PORT,
  fetch: router,
});

console.log(`Backend running on http://localhost:${PORT}`);