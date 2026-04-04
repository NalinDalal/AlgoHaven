import { prisma } from "@/packages/db";
import {
  generateSessionToken,
  hashToken,
  hashPassword,
  verifyPassword,
} from "@/packages/auth";
import { success, failure } from "@/packages/utils/response";
import { getCookie } from "@/packages/utils/cookies";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// POST /api/auth/register
// Body: { email, password, username? }
export async function handleRegister(req: Request): Promise<Response> {
  const { email, password, username } = (await req.json()) as {
    email?: string;
    password?: string;
    username?: string;
  };

  if (!email || !email.includes("@")) {
    return failure("Valid email required", null, 400);
  }
  if (!password || password.length < 6) {
    return failure("Password must be at least 6 characters", null, 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return failure("Email already registered", null, 409);
  }

  if (username) {
    const usernameTaken = await prisma.user.findUnique({ where: { username } });
    if (usernameTaken) {
      return failure("Username already taken", null, 409);
    }
  }

  const passwordHash = hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, username: username || null },
  });

  const { raw, hash } = generateSessionToken();
  await prisma.session.create({
    data: {
      tokenHash: hash,
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return success("Registration successful", {
    user: { id: user.id, email: user.email, role: user.role },
  });
}

// POST /api/auth/login
// Body: { email, password }
export async function handleLogin(req: Request): Promise<Response> {
  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return failure("Email and password required", null, 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return failure("Invalid email or password", null, 401);
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return failure("Invalid email or password", null, 401);
  }

  const { raw, hash } = generateSessionToken();
  await prisma.session.create({
    data: {
      tokenHash: hash,
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return new Response(
    JSON.stringify({
      status: "success",
      message: "Login successful",
      data: { user: { id: user.id, email: user.email, role: user.role } },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${raw}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000};`,
      },
    },
  );
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

// DEV ONLY: Create admin session for testing
export async function handleDevLogin(req: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return failure("Not available in production", null, 404);
  }

  const { email } = (await req.json()) as { email?: string };
  if (!email) return failure("Email required", null, 400);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, role: "USER" } });
  }

  const { raw, hash } = generateSessionToken();
  await prisma.session.create({
    data: {
      tokenHash: hash,
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return new Response(
    JSON.stringify({
      status: "success",
      message: "Login successful",
      data: { user: { id: user.id, email: user.email, role: user.role } },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${raw}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`,
      },
    },
  );
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
  const sessionCookie = getCookie(req, "session");
  if (sessionCookie) return sessionCookie;

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
