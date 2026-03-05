// Email sending helper for magic link
import { AUTH_EMAIL_FROM, MAGIC_LINK_TTL_MS } from "../config";

export async function sendMagicLinkEmail(email: string, verifyUrl: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const magicLinkTtlMinutes = Math.round(MAGIC_LINK_TTL_MS / 60000);
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
      html: `<p>Click to sign in:</p><p><a href=\"${verifyUrl}\">${verifyUrl}</a></p><p>This link expires in ${magicLinkTtlMinutes} minutes.</p>`,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send magic link email: ${text}`);
  }
  return true;
}
