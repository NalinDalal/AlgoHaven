/**
 * Cookie helpers - parsing incoming cookies and building session Set-Cookie values.
 */
import { SESSION_COOKIE_NAME } from "../config";

/**
 * getCookie - pull a cookie value from the request headers.
 *
 * @param req - incoming Request
 * @param name - cookie name to retrieve
 * @returns decoded cookie value or undefined
 */
export function getCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }
  return undefined;
}

/**
 * makeSessionCookie - build a `Set-Cookie` header value for session tokens.
 *
 * @param value - raw session token value (will be encoded)
 * @param maxAgeSeconds - cookie max-age in seconds
 * @returns formatted Set-Cookie string
 */
export function makeSessionCookie(value: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}
