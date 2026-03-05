// Email sending helper for magic link
import { AUTH_EMAIL_FROM, MAGIC_LINK_TTL_MS } from "../config";

function buildMagicLinkEmail(verifyUrl: string, magicLinkTtlMinutes: number) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0; background:#f4f4f5; font-family: -apple-system, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background:#18181b; padding: 32px 40px;">
                    <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.3px;">
                      AlgoHaven
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 8px; font-size: 20px; color: #18181b;">Your sign-in link</h2>
                    <p style="margin: 0 0 32px; color: #71717a; font-size: 15px; line-height: 1.6;">
                      Click the button below to sign in to your AlgoHaven account. No password needed.
                    </p>

                    <a href="${verifyUrl}"
                      style="display:inline-block; background:#18181b; color:#ffffff; text-decoration:none;
                             font-size:15px; font-weight:600; padding: 14px 28px; border-radius:8px;">
                      Sign in to AlgoHaven →
                    </a>

                    <p style="margin: 32px 0 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
                      This link expires in <strong>${magicLinkTtlMinutes} minutes</strong> and can only be used once.<br/>
                      If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; border-top: 1px solid #f4f4f5;">
                    <p style="margin:0; color:#a1a1aa; font-size:12px;">
                      AlgoHaven · If the button doesn't work, copy this link:<br/>
                      <a href="${verifyUrl}" style="color:#71717a; word-break:break-all;">${verifyUrl}</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

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
      html: buildMagicLinkEmail(verifyUrl, magicLinkTtlMinutes),
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send magic link email: ${text}`);
  }
  return true;
}
