import { prisma, type Role } from "@algohaven/db";
import {
  generateSessionToken,
  hashSessionToken,
  hashPassword,
  verifyPassword,
} from "@algohaven/auth";
import { success, failure, getCookie, getParams, getIdParams, type IdParams } from "@algohaven/utils";
import { auth } from "@algohaven/logger";

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  role: Role;
  banned: boolean;
  warnings: number;
}

export interface AuthResult {
  user: AuthUser;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SECURE_COOKIE =
  process.env.NODE_ENV === "production" ? "Secure; " : "";

// ─── Rate limiting ────────────────────────────────────────────────────────────

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_LOGIN = 10;
const RATE_MAX_REGISTER = 3;
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, max: number): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count++;
  return bucket.count <= max;
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
}

// Periodically evict stale buckets
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of ipBuckets) {
    if (now > bucket.resetAt) ipBuckets.delete(ip);
  }
}, 60_000).unref();

// POST /api/auth/register
// Body: { email, password, username? }
export async function handleRegister(req: Request): Promise<Response> {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip, RATE_MAX_REGISTER)) {
    auth.warn({ ip }, "Rate limit exceeded on register");
    return failure("Too many registration attempts. Try again later.", null, 429);
  }

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
    auth.warn({ email }, "Registration attempt with existing email");
    return failure("Email already registered", null, 409);
  }

  if (username) {
    const usernameTaken = await prisma.user.findUnique({ where: { username } });
    if (usernameTaken) {
      auth.warn({ username }, "Registration attempt with taken username");
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

  auth.info({ userId: user.id, email }, "User registered successfully");
  return new Response(
    JSON.stringify({
      status: "success",
      message: "Registration successful",
      data: { user: { id: user.id, email: user.email, role: user.role } },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${raw}; HttpOnly; ${SECURE_COOKIE}SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000};`,
      },
    },
  );
}

// POST /api/auth/login
// Body: { email, password }
export async function handleLogin(req: Request): Promise<Response> {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip, RATE_MAX_LOGIN)) {
    auth.warn({ ip }, "Rate limit exceeded on login");
    return failure("Too many login attempts. Try again later.", null, 429);
  }

  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return failure("Email and password required", null, 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    auth.warn({ email }, "Login attempt with invalid email");
    return failure("Invalid email or password", null, 401);
  }

  if (!verifyPassword(password, user.passwordHash)) {
    auth.warn({ userId: user.id, email }, "Login attempt with wrong password");
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

  auth.info({ userId: user.id, email }, "User logged in successfully");
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
        "Set-Cookie": `session=${raw}; HttpOnly; ${SECURE_COOKIE}SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000};`,
      },
    },
  );
}

// POST /api/auth/signout
export async function handleSignout(req: Request): Promise<Response> {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashSessionToken(token) },
      data: { revokedAt: new Date() },
    });
    auth.info("User signed out");
  }
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": `session=; HttpOnly; ${SECURE_COOKIE}Path=/; Max-Age=0` },
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
    auth.info({ userId: user.id, email }, "Dev user created");
  }

  const { raw, hash } = generateSessionToken();
  await prisma.session.create({
    data: {
      tokenHash: hash,
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  auth.info({ userId: user.id, email }, "Dev login successful");
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
        "Set-Cookie": `session=${raw}; HttpOnly; ${SECURE_COOKIE}SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`,
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
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        select: {
          id: true, email: true, username: true, role: true, banned: true, warnings: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;

  return session.user;
}

export async function requireAuth(
  req: Request,
): Promise<AuthResult | Response> {
  const user = await getUserFromRequest(req);
  if (!user) return failure("Unauthorized", null, 401);
  if (user.banned) return failure("Your account has been banned", null, 403);
  return { user };
}

export async function requireAdmin(
  req: Request,
): Promise<AuthResult | Response> {
  const user = await getUserFromRequest(req);
  if (!user) return failure("Unauthorized", null, 401);
  if (user.banned) return failure("Your account has been banned", null, 403);
  if (user.role !== "ADMIN") return failure("Forbidden", null, 403);
  return { user };
}

// PUT /api/users/:id/role
// Body: { role: "USER" | "ADMIN" }
// Admin only
export async function handleUpdateUserRole(req: Request): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const { id } = getIdParams(req);
  const { role } = (await req.json()) as { role?: string };

  if (!id) return failure("User ID required", null, 400);
  if (!role || (role !== "USER" && role !== "ADMIN")) {
    return failure("Valid role required (USER or ADMIN)", null, 400);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return failure("User not found", null, 404);

  const updated = await prisma.user.update({
    where: { id },
    data: { role: role as "USER" | "ADMIN" },
  });

  auth.info({ targetUserId: id, newRole: role, adminId: authResult.user.id }, "User role updated");
  return success("User role updated", {
    user: { id: updated.id, email: updated.email, role: updated.role },
  });
}

// GET /api/users
// Admin only - list all users
export async function handleListUsers(req: Request): Promise<Response> {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);

  return success("Users retrieved", {
    users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
