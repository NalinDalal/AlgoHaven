import { prisma } from "@/packages/db";
import {
  generateMagicLinkToken,
  generateSessionToken,
  hashToken,
} from "@/packages/auth";
import { sendMagicLinkEmail } from "@/packages/auth/email";
import { success, failure } from "@/packages/utils/response";

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// POST /api/auth/magic-link
// Body: { email }
// Creates a MagicLinkToken and emails the link to the user.
export async function handleRequestMagicLink(req: Request): Promise<Response> {
  const { email } = (await req.json()) as { email?: string };

  if (!email || !email.includes("@")) {
    return failure("Valid email required", null, 400);
  }

  // Upsert user — create on first login, find on subsequent ones
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  // Invalidate any existing unused tokens for this email to prevent token pile-up
  await prisma.magicLinkToken.updateMany({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() }, // expire them immediately
  });

  const { raw, hash } = generateMagicLinkToken();
  await prisma.magicLinkToken.create({
    data: {
      email,
      tokenHash: hash,
      userId: user.id,
      expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
    },
  });

  const magicLinkUrl = `${process.env.APP_URL}/auth/verify?token=${raw}`;
  await sendMagicLinkEmail({ to: email, url: magicLinkUrl });

  // Always return 200 — don't leak whether the email exists
  return success(
    "If that email is registered, a magic link has been sent.",
    null,
    200,
  );
}

// GET /api/auth/verify?token=<raw>
// Validates the token, creates a session, redirects to app.
export async function handleVerifyMagicLink(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const raw = url.searchParams.get("token");

  if (!raw) {
    return failure("Token required", null, 400);
  }

  const hash = hashToken(raw);
  const magic = await prisma.magicLinkToken.findUnique({
    where: { tokenHash: hash },
  });

  if (!magic) return failure("Invalid token", null, 401);
  if (magic.usedAt) return failure("Token already used", null, 401);
  if (magic.expiresAt < new Date()) return failure("Token expired", null, 401);

  // Mark token as used
  await prisma.magicLinkToken.update({
    where: { tokenHash: hash },
    data: { usedAt: new Date() },
  });

  // Create session
  const { raw: sessionRaw, hash: sessionHash } = generateSessionToken();
  await prisma.session.create({
    data: {
      tokenHash: sessionHash,
      userId: magic.userId!,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  // Redirect to app with session cookie set
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${process.env.APP_URL}/dashboard`,
      "Set-Cookie": `session=${sessionRaw}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`,
    },
  });
}

// POST /api/auth/signout
export async function handleSignout(req: Request): Promise<Response> {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token) },
      data: { revokedAt: new Date() },
    });
  }
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": "session=; HttpOnly; Path=/; Max-Age=0" },
  });
}

// GET /api/auth/me
export async function handleMe(req: Request): Promise<Response> {
  const user = await getUserFromRequest(req);
  if (!user) return failure("Unauthorized", null, 401);
  return success("User retrieved", { user });
}

// ---------------------------------------------------------------------------
// Session helpers — import these in other route handlers
// ---------------------------------------------------------------------------

export function getSessionTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
    if (match) return match[1] ?? null;
  }
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function getUserFromRequest(req: Request) {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: { select: { id: true, email: true, username: true, role: true } },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;

  return session.user;
}

export async function requireAuth(
  req: Request,
): Promise<{ user: any } | Response> {
  const user = await getUserFromRequest(req);
  if (!user) return failure("Unauthorized", null, 401);
  return { user };
}

export async function requireAdmin(
  req: Request,
): Promise<{ user: any } | Response> {
  const user = await getUserFromRequest(req);
  if (!user) return failure("Unauthorized", null, 401);
  if (user.role !== "ADMIN") return failure("Forbidden", null, 403);
  return { user };
}
