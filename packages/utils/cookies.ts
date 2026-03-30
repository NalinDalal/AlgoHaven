export function parseCookies(
  cookieHeader: string | null,
): Record<string, string> {
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key) {
      cookies[key] = valueParts.join("=");
    }
  }
  return cookies;
}

export function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  return cookies[name] ?? null;
}

export function createSetCookieHeader(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    path?: string;
    maxAge?: number;
    secure?: boolean;
  } = {},
): string {
  const parts = [`${name}=${value}`];

  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.secure) parts.push("Secure");

  return parts.join("; ");
}
