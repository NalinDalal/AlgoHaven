/**
 * Cryptographic helpers used by auth flows: token creation and hashing.
 */
import { createHash, randomBytes } from "node:crypto";

/**
 * hashToken - deterministically hash a token string using SHA-256.
 *
 * @param token - raw token string
 * @returns hex-encoded sha256 hash
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * createToken - creates a cryptographically secure random token.
 *
 * @returns hex-encoded random bytes (64 chars)
 */
export function createToken(): string {
  return randomBytes(32).toString("hex");
}
