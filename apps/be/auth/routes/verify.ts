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

// Use a type-only import to resolve the conflict
import type { MagicLinkToken } from "../../../../packages/db/generated/zenstack/models";

// Define the MagicLinkToken type explicitly
interface LocalMagicLinkToken {
  expiresAt: Date;
  userId?: string;
  email: string;
  id: string;
}

export const verifyRoute = {
  GET: async (req: Request) => {
    try {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      if (!token) return Response.json({ error: "Token is required" }, { status: 400 });

      const tokenHash = hashToken(token);
      const now = new Date();

      // Debug the query result to verify its structure
      const magicLink = (await db.magicLinkToken.findFirst({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      })) as unknown as { expiresAt: Date; userId?: string; email: string; id: string } | null;

      console.log("Debug magicLink result:", magicLink);

      if (!magicLink) {
        //@ts-ignore
        const errorMessage = magicLink?.expiresAt < now
          ? "This magic link has expired. Please request a new one."
          : "Invalid magic link. Please check the link or request a new one.";
        return Response.json({ error: errorMessage }, { status: 401 });
      }

      let user = magicLink.userId ? await db.user.findUnique({ where: { id: magicLink.userId } }) : null;
      if (!user) {
        user = await db.user.upsert({ where: { email: magicLink.email }, update: {}, create: { email: magicLink.email } });
      }

      // Mark the token as used to ensure single-use
      await db.magicLinkToken.update({
        where: { id: magicLink.id },
        data: { usedAt: now },
      });

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
