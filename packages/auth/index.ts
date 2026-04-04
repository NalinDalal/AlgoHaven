import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  randomUUID,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENC_KEY = process.env.AUTH_SECRET || randomUUID();
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const computed = createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return computed === hash;
}

export function generateMagicLinkToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateSessionToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}
