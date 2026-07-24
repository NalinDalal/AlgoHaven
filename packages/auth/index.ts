import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";

const SALT_ROUNDS = 12;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, stored: string): boolean {
  return bcrypt.compareSync(password, stored);
}

export function hashSessionToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateSessionToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = hashSessionToken(raw);
  return { raw, hash };
}
