// Central route map for Bun server
// Add your route handlers here and export as `routes`

import { db } from "@/packages/db/db";
// BunFile type for Bun.file usage
type BunFile = ReturnType<typeof Bun.file>;
import { getErrorMessage, BE_URL, MAGIC_LINK_TTL_MS, SESSION_TTL_MS, SESSION_COOKIE_NAME } from "../config";
import { hashToken, createToken } from "../utils/crypto";
import { getCookie, makeSessionCookie } from "../utils/cookies";
import { getCurrentUser } from "../utils/session";
import { sendMagicLinkEmail } from "../utils/email";

interface RouteHandler {
    (req: Request & { params?: Record<string, string> }): Response | Promise<Response>;
}

interface MethodHandlers {
    GET?: RouteHandler;
    POST?: RouteHandler;
    PUT?: RouteHandler;
    DELETE?: RouteHandler;
    [method: string]: RouteHandler | undefined;
}

type RouteValue =
    | Response
    | RouteHandler
    | MethodHandlers
    | BunFile;

interface Routes {
    [path: string]: RouteValue;
}

export const routes: Routes = {
    "/api/status": new Response("OK"),

    "/users/:id": (req: Request & { params?: Record<string, string> }): Response => {
        return new Response(`Hello User ${req.params?.id}!`);
    },

    "/api/posts": {
        GET: (): Response => new Response("List posts"),
        POST: async (req: Request): Promise<Response> => {
            const body = (await req.json()) as Record<string, unknown>;
            return Response.json({ created: true, ...body });
        },
    },

    "/api/*": Response.json({ message: "Not found" }, { status: 404 }),

    "/blog/hello": Response.redirect("/blog/hello/world"),

    "/favicon.ico": Bun.file("./favicon.ico"),

    "/api/auth/request-link": {
        POST: async (req: Request): Promise<Response> => {
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
                // Point magic link to frontend /verify page
                const FE_URL = process.env.FE_URL ?? "http://localhost:3000";
                const verifyUrl = `${FE_URL}/verify?token=${rawMagicToken}`;
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

    "/api/auth/verify": {
        GET: async (req: Request): Promise<Response> => {
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

    "/api/auth/me": {
        GET: async (req: Request): Promise<Response> => {
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

    "/api/auth/logout": {
        POST: async (req: Request): Promise<Response> => {
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
};
