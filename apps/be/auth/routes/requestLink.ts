/**
 * POST /api/auth/request-link
 *
 * Creates a magic link token and (optionally) sends it by email.
 */
import { db } from "../../src/db";
import { createToken, hashToken } from "../../utils/crypto";
import { MAGIC_LINK_TTL_MS, BE_URL } from "../../config";
import { sendMagicLinkEmail } from "../email";
import { getErrorMessage } from "../../utils/errors";

export const requestLinkRoute = {
  POST: async (req: Request) => {
    try {
      const { email } = (await req.json()) as { email?: string };
      if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

      const normalizedEmail = email.trim().toLowerCase();

      // Attempt to find an existing user; we still create a token regardless.
      const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });

      // Rate limiting: Prevent abuse of the endpoint
      const recentRequest = await db.magicLinkToken.findFirst({
        where: {
          email: normalizedEmail,
          createdAt: { gt: new Date(Date.now() - MAGIC_LINK_TTL_MS) },
        },
      });

      if (recentRequest) {
        return Response.json({ error: "A magic link was recently sent. Please wait before requesting another." }, { status: 429 });
      }

      const rawMagicToken = createToken();
      const tokenHash = hashToken(rawMagicToken);

      await db.magicLinkToken.create({
        data: {
          email: normalizedEmail,
          tokenHash,
          userId: existingUser?.id,
          expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
        },
      });

      const verifyUrl = `${BE_URL}/api/auth/verify?token=${rawMagicToken}`;
      const sentByEmail = await sendMagicLinkEmail(normalizedEmail, verifyUrl);

      if (!sentByEmail && process.env.NODE_ENV !== "production") {
        return Response.json({ message: "Magic link generated", verifyUrl });
      }

      return Response.json({ message: "Magic link sent" });
    } catch (error) {
      return Response.json({ error: getErrorMessage(error) }, { status: 400 });
    }
  },
};
