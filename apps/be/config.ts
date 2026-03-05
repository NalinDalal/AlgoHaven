/**
 * Configuration and environment-derived constants for the backend.
 *
 * Keep all environment parsing here so other modules can be pure functions
 * and easy to test.
 */
export const BE_PORT = Number(process.env.BE_PORT ?? 3001);
export const BE_URL = process.env.BE_URL ?? `http://localhost:${BE_PORT}`;
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "algohaven_session";
export function getPositiveNumberEnv(name: string, fallback: number) {
	const rawValue = process.env[name];
	if (!rawValue) return fallback;
	const parsed = Number(rawValue);
	if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
	return parsed;
}

export const MAGIC_LINK_TTL_MS = getPositiveNumberEnv("MAGIC_LINK_TTL_MS", 15 * 60 * 1000);
export const SESSION_TTL_MS = getPositiveNumberEnv("SESSION_TTL_MS", 7 * 24 * 60 * 60 * 1000);
export const AUTH_EMAIL_FROM = process.env.AUTH_EMAIL_FROM ?? "AlgoHaven <onboarding@resend.dev>";

export function getErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}
	return "Unknown error";
}
