/**
 * Session helpers - resolve the current user from the request session cookie.
 */
import { db } from "../src/db";
import { getCookie } from "../utils/cookies";
import { hashToken } from "../utils/crypto";
import { SESSION_COOKIE_NAME } from "../config";

/**
 * getCurrentUser - returns the user associated with the current session.
 *
 * Query the `session` table for a valid (not revoked, not expired) session
 * using the cookie sent with the request.
 */
export async function getCurrentUser(req: Request) {
  const sessionToken = getCookie(req, SESSION_COOKIE_NAME);
  if (!sessionToken) return null;
  const tokenHash = hashToken(sessionToken);
  const now = new Date();
  const session = await db.session.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
    include: { user: true },
  });
  if (!session) return null;
  return session.user;
}
