import "server-only";
import { randomBytes, createHash } from "node:crypto";
import {
  passwordResetStore,
  type StoredPasswordReset,
} from "@/lib/db/store";
import { findUserByEmail, setUserPassword } from "@/lib/auth";
import { sendEmail, appBaseUrl } from "@/lib/email";

/** How long a reset link stays valid. */
const TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Drop expired/used rows so the store doesn't grow without bound. */
function prune(rows: StoredPasswordReset[]): StoredPasswordReset[] {
  const now = Date.now();
  return rows.filter(
    (r) => !r.usedAt && new Date(r.expiresAt).getTime() > now,
  );
}

/**
 * Create a reset token for the account with this email and send the link.
 *
 * Always resolves without revealing whether the email exists (anti-enumeration);
 * the caller shows the same confirmation regardless.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) return; // silently no-op — don't leak which emails are registered

  const rawToken = randomBytes(32).toString("hex");
  const now = new Date();
  const record: StoredPasswordReset = {
    tokenHash: hashToken(rawToken),
    userId: user.id,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TTL_MS).toISOString(),
  };

  const rows = prune(await passwordResetStore.all());
  // Invalidate any prior pending tokens for this user.
  const filtered = rows.filter((r) => r.userId !== user.id);
  filtered.push(record);
  await passwordResetStore.save(filtered);

  const link = `${appBaseUrl()}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "إعادة تعيين كلمة المرور",
    text: `لإعادة تعيين كلمة المرور، افتح الرابط التالي (صالح لمدة ساعة):\n${link}\n\nإذا لم تطلب ذلك، تجاهل هذه الرسالة.`,
    html: resetEmailHtml(link),
  });
}

/** Validate a raw token without consuming it (for the reset form to gate UI). */
export async function isResetTokenValid(rawToken: string): Promise<boolean> {
  if (!rawToken) return false;
  const hash = hashToken(rawToken);
  const rows = await passwordResetStore.all();
  const row = rows.find((r) => r.tokenHash === hash);
  return Boolean(
    row && !row.usedAt && new Date(row.expiresAt).getTime() > Date.now(),
  );
}

export type ResetResult = "ok" | "invalid" | "expired";

/**
 * Consume a token and set the new password. Single-use: the token is marked
 * used on success. Returns a status the action can map to a user message.
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
): Promise<ResetResult> {
  if (!rawToken) return "invalid";
  const hash = hashToken(rawToken);
  const rows = await passwordResetStore.all();
  const idx = rows.findIndex((r) => r.tokenHash === hash);
  if (idx === -1) return "invalid";

  const row = rows[idx];
  if (row.usedAt) return "invalid";
  if (new Date(row.expiresAt).getTime() <= Date.now()) return "expired";

  const ok = await setUserPassword(row.userId, newPassword);
  if (!ok) return "invalid";

  rows[idx] = { ...row, usedAt: new Date().toISOString() };
  await passwordResetStore.save(prune(rows));
  return "ok";
}

function resetEmailHtml(link: string): string {
  return `<!doctype html>
<html dir="rtl" lang="ar">
  <body style="margin:0;background:#0b0b0f;font-family:Tahoma,Arial,sans-serif;color:#e8e8ea;padding:24px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#16161c;border:1px solid #26262e;border-radius:16px;padding:28px">
          <tr><td>
            <h1 style="margin:0 0 12px;font-size:20px;color:#fff">إعادة تعيين كلمة المرور</h1>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#b6b6bd">
              تلقّينا طلبًا لإعادة تعيين كلمة المرور لحسابك. اضغط على الزر أدناه لاختيار كلمة مرور جديدة. الرابط صالح لمدة ساعة واحدة.
            </p>
            <a href="${link}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:9999px">إعادة التعيين</a>
            <p style="margin:20px 0 0;font-size:12px;line-height:1.7;color:#7c7c85">
              إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
