// User session helper for extracting current user from session cookie
import { db } from "../../../packages/db/db";
import { hashToken } from "./crypto";
import { getCookie } from "./cookies";
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "../config";

export async function getCurrentUser(req: Request) {
  const sessionToken = getCookie(req, SESSION_COOKIE_NAME);
  if (!sessionToken) return null;
  const tokenHash = hashToken(sessionToken);
  const now = new Date();
  const session = await db.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    include: {
      user: true,
    },
  });
  if (!session) return null;
  return session.user;
}
