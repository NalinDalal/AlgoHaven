/**
 * POST /api/auth/logout
 *
 * Revokes the current session and clears the session cookie.
 */
import { getCookie, makeSessionCookie } from "../../utils/cookies";
import { hashToken } from "../../utils/crypto";
import { db } from "../../src/db";
import { SESSION_COOKIE_NAME } from "../../config";
import { getErrorMessage } from "../../utils/errors";

export const logoutRoute = {
  POST: async (req: Request) => {
    try {
      const sessionToken = getCookie(req, SESSION_COOKIE_NAME);
      if (sessionToken) {
        const tokenHash = hashToken(sessionToken);
        await db.session.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
      }

      const clearCookie = makeSessionCookie("", 0);

      return new Response(JSON.stringify({ message: "Logged out" }), {
        status: 200,
        headers: { "content-type": "application/json", "set-cookie": clearCookie },
      });
    } catch (error) {
      return Response.json({ error: getErrorMessage(error) }, { status: 400 });
    }
  },
};
