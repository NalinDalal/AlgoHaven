/**
 * Email helper to send magic sign-in links.
 */
import { AUTH_EMAIL_FROM, MAGIC_LINK_TTL_MS } from "../config";

/**
 * sendMagicLinkEmail - attempt to send a magic link via Resend API.
 *
 * If no API key is configured we log the URL to stdout so local development
 * still works.
 */
export async function sendMagicLinkEmail(email: string, verifyUrl: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const magicLinkTtlMinutes = Math.round(MAGIC_LINK_TTL_MS / 60000);

  if (!resendApiKey) {
    // In development we just log the magic link instead of sending.
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
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="color: #4CAF50;">Welcome to AlgoHaven!</h2>
          <p>Click the button below to sign in:</p>
          <p>
            <a href="${verifyUrl}" style="
              display: inline-block;
              padding: 10px 20px;
              color: white;
              background-color: #4CAF50;
              text-decoration: none;
              border-radius: 5px;
            ">Sign In</a>
          </p>
          <p style="color: #555; font-size: 0.9em;">
            This link expires in ${magicLinkTtlMinutes} minutes.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 0.8em;">
            If you did not request this email, you can safely ignore it.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send magic link email: ${text}`);
  }

  return true;
}
