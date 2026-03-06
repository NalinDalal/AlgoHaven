/**
 * GET /api/auth/verify
 *
 * Validates a magic link token, creates/links a user, creates a session,
 * and returns a Set-Cookie header to establish the session.
 */
import { db } from "../../src/db";
import { hashToken, createToken } from "../../utils/crypto";
import { SESSION_TTL_MS } from "../../config";
import { makeSessionCookie } from "../../utils/cookies";
import { getErrorMessage } from "../../utils/errors";

export const verifyRoute = {
  GET: async (req: Request) => {
    try {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      if (!token) return Response.json({ error: "Token is required" }, { status: 400 });

      const tokenHash = hashToken(token);
      const now = new Date();

      const magicLink = await db.magicLinkToken.findFirst({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      });

      if (!magicLink) return Response.json({ error: "Invalid or expired magic link" }, { status: 401 });

      let user = magicLink.userId ? await db.user.findUnique({ where: { id: magicLink.userId } }) : null;
      if (!user) {
        user = await db.user.upsert({ where: { email: magicLink.email }, update: {}, create: { email: magicLink.email } });
      }

      await db.magicLinkToken.update({ where: { id: magicLink.id }, data: { usedAt: now, userId: user.id } });

      const rawSessionToken = createToken();
      const sessionHash = hashToken(rawSessionToken);

      await db.session.create({ data: { tokenHash: sessionHash, userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) } });

      const setCookie = makeSessionCookie(rawSessionToken, Math.floor(SESSION_TTL_MS / 1000));

      // Log the response before redirecting
      console.log("User authenticated successfully. Redirecting to dashboard...");

      // Redirect user to dashboard after successful authentication
      const redirectUrl = new URL("/dashboard", url.origin);
      return Response.redirect(redirectUrl.toString(), 302);

    
    } catch (error) {
      return Response.json({ error: getErrorMessage(error) }, { status: 400 });
    }
  },
};
