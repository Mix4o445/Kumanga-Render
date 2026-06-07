import "server-only";

/**
 * Minimal transactional-email sender backed by Resend (https://resend.com).
 *
 * Uses the REST API directly via fetch so there's no extra dependency. Configure
 * with two env vars:
 *   • RESEND_API_KEY — your Resend API key (required to actually send).
 *   • EMAIL_FROM     — verified sender, e.g. "Kumanga <noreply@yourdomain.com>".
 *
 * When RESEND_API_KEY is missing (e.g. local dev), emails are logged to the
 * server console instead of sent, so the flow still works end-to-end locally.
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    // Dev fallback: no provider configured — log so the link is still usable.
    console.warn(
      `[email] RESEND_API_KEY not set — email not sent.\n` +
        `  to: ${to}\n  subject: ${subject}\n  text: ${text ?? "(html only)"}`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Failed to send email (${res.status}): ${detail || res.statusText}`,
    );
  }
}

/** Absolute base URL of the app, used to build links inside emails. */
export function appBaseUrl(): string {
  const explicit = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
