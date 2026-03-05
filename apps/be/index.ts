/**
 * Entry point for the backend server.
 *
 * Starts a Bun HTTP server wired to the route map exported from `routes/index.ts`.
 */
import { routes } from "./routes";
import { BE_PORT } from "./config";

// Start the Bun server with the assembled routes.
function withCORS(res: Response, req?: Request) {
  const headers = new Headers(res.headers);
  let origin = "http://localhost:3000"; // Default to localhost:3000 for development
  if (req) {
    const reqOrigin = req.headers.get("Origin");
    if (reqOrigin) origin = reqOrigin;
  }
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  headers.set("Access-Control-Allow-Credentials", "true");
  return new Response(res.body, { ...res, headers });
}

const server = Bun.serve({
  port: BE_PORT,
  async fetch(req) {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return withCORS(new Response(null, { status: 204 }), req);
    }
    // Try to match a route
    const url = new URL(req.url);
    const route = routes[url.pathname];
    if (route) {
      if (typeof route === "function") {
        return withCORS(await route(req), req);
      } else if (
        typeof route === "object" && route !== null
      ) {
        // Always wrap MethodHandlers
        const methodHandler = (route as Record<string, (req: Request) => Promise<Response> | Response>)[req.method];
        if (methodHandler) {
          return withCORS(await methodHandler(req), req);
        }
        // If it's a Response object, wrap it
        if ("body" in route && "headers" in route) {
          return withCORS(route as Response, req);
        }
      }
    }
    // Fallback for any request that doesn't match configured routes.
    return withCORS(new Response("Not Found", { status: 404 }), req);
  },
});

console.log(`Server running at http://localhost:${BE_PORT}/`);