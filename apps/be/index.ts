import { db } from "@/packages/db/db";
import { createHash, randomBytes } from "node:crypto";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

const BE_PORT = Number(process.env.BE_PORT ?? 3001);
const APP_URL = process.env.APP_URL ?? `http://localhost:${BE_PORT}`;
const SESSION_COOKIE_NAME = "algohaven_session";
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_EMAIL_FROM = process.env.AUTH_EMAIL_FROM ?? "AlgoHaven <onboarding@resend.dev>";

async function sendMagicLinkEmail(email: string, verifyUrl: string) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log(`[magic-link] ${email}: ${verifyUrl}`);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: AUTH_EMAIL_FROM,
      to: [email],
      subject: "Your AlgoHaven sign-in link",
      html: `<p>Click to sign in:</p><p><a href=\"${verifyUrl}\">${verifyUrl}</a></p><p>This link expires in 15 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send magic link email: ${text}`);
  }

  return true;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createToken() {
  return randomBytes(32).toString("hex");
}

function getCookie(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");

    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return undefined;
}

function makeSessionCookie(value: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

async function getCurrentUser(req: Request) {
  const sessionToken = getCookie(req, SESSION_COOKIE_NAME);

  if (!sessionToken) {
    return null;
  }

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

  if (!session) {
    return null;
  }

  return session.user;
}

const server = Bun.serve({
  port: BE_PORT,
  // `routes` requires Bun v1.2.3+
  routes: {
    // Static routes
    "/api/status": new Response("OK"),

    // Dynamic routes
    "/users/:id": req => {
      return new Response(`Hello User ${req.params.id}!`);
    },

    // Per-HTTP method handlers
    "/api/posts": {
      GET: () => new Response("List posts"),
      POST: async req => {
        const body = (await req.json()) as Record<string, unknown>;
        return Response.json({ created: true, ...body });
      },
    },

    // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
    "/api/*": Response.json({ message: "Not found" }, { status: 404 }),

    // Redirect from /blog/hello to /blog/hello/world
    "/blog/hello": Response.redirect("/blog/hello/world"),

    // Serve a file by lazily loading it into memory
    "/favicon.ico": Bun.file("./favicon.ico"),


    // Request magic-link route
    "/api/auth/request-link": {
      POST: async req => {
        try {
          const { email } = (await req.json()) as { email?: string };

          if (!email) {
            return Response.json({ error: "Email is required" }, { status: 400 });
          }

          const normalizedEmail = email.trim().toLowerCase();
          const existingUser = await db.user.findUnique({
            where: { email: normalizedEmail },
          });

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

          const verifyUrl = `${APP_URL}/api/auth/verify?token=${rawMagicToken}`;
          const sentByEmail = await sendMagicLinkEmail(normalizedEmail, verifyUrl);

          if (!sentByEmail && process.env.NODE_ENV !== "production") {
            return Response.json({ message: "Magic link generated", verifyUrl });
          }

          return Response.json({ message: "Magic link sent" });
        } catch (error) {
          return Response.json({ error: getErrorMessage(error) }, { status: 400 });
        }
      },
    },

    // Verify magic-link route
    "/api/auth/verify": {
      GET: async req => {
        try {
          const url = new URL(req.url);
          const token = url.searchParams.get("token");

          if (!token) {
            return Response.json({ error: "Token is required" }, { status: 400 });
          }

          const tokenHash = hashToken(token);
          const now = new Date();

          const magicLink = await db.magicLinkToken.findFirst({
            where: {
              tokenHash,
              usedAt: null,
              expiresAt: { gt: now },
            },
          });

          if (!magicLink) {
            return Response.json({ error: "Invalid or expired magic link" }, { status: 401 });
          }

          let user =
            magicLink.userId
              ? await db.user.findUnique({ where: { id: magicLink.userId } })
              : null;

          if (!user) {
            user = await db.user.upsert({
              where: { email: magicLink.email },
              update: {},
              create: { email: magicLink.email },
            });
          }

          await db.magicLinkToken.update({
            where: { id: magicLink.id },
            data: { usedAt: now, userId: user.id },
          });

          const rawSessionToken = createToken();
          const sessionHash = hashToken(rawSessionToken);

          await db.session.create({
            data: {
              tokenHash: sessionHash,
              userId: user.id,
              expiresAt: new Date(Date.now() + SESSION_TTL_MS),
            },
          });

          const setCookie = makeSessionCookie(rawSessionToken, Math.floor(SESSION_TTL_MS / 1000));

          return new Response(JSON.stringify({ message: "Authenticated", user }), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "set-cookie": setCookie,
            },
          });
        } catch (error) {
          return Response.json({ error: getErrorMessage(error) }, { status: 400 });
        }
      },
    },

    // Get current session user
    "/api/auth/me": {
      GET: async req => {
        try {
          const user = await getCurrentUser(req);

          if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          return Response.json({ user });
        } catch (error) {
          return Response.json({ error: getErrorMessage(error) }, { status: 400 });
        }
      },
    },

    // Logout and revoke session
    "/api/auth/logout": {
      POST: async req => {
        try {
          const sessionToken = getCookie(req, SESSION_COOKIE_NAME);

          if (sessionToken) {
            const tokenHash = hashToken(sessionToken);

            await db.session.updateMany({
              where: { tokenHash, revokedAt: null },
              data: { revokedAt: new Date() },
            });
          }

          const clearCookie = makeSessionCookie("", 0);

          return new Response(JSON.stringify({ message: "Logged out" }), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "set-cookie": clearCookie,
            },
          });
        } catch (error) {
          return Response.json({ error: getErrorMessage(error) }, { status: 400 });
        }
      },
    },
  },

  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);