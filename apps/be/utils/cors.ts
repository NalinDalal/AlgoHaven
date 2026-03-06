// Start the Bun server with the assembled routes.
export function withCORS(res: Response, req?: Request) {
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