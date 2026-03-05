/**
 * Entry point for the backend server.
 *
 * Starts a Bun HTTP server wired to the route map exported from `routes/index.ts`.
 */
import { routes } from "./routes";
import { BE_PORT } from "./config";

// Start the Bun server with the assembled routes.
const server = Bun.serve({
  port: BE_PORT,
  routes,
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);