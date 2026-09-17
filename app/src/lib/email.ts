import { Resend } from "resend";

/** Sends via Resend when RESEND_API_KEY is set; logs to the server console
 *  otherwise (local development). FROM address needs the real domain —
 *  open decision OPEN-3 in the ops repo. */
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${html}`);
    return;
  }
  const resend = new Resend(key);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Ten Talents <onboarding@resend.dev>",
    to, subject, html,
  });
}

export const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

export function verifyEmailHtml(link: string) {
  return `<p>Welcome to the Ten Talents Academy.</p>
<p><a href="${link}">Confirm your email address</a> to finish creating your account.</p>
<p>If you didn't create an account, you can ignore this email.</p>`;
}
export function resetEmailHtml(link: string) {
  return `<p><a href="${link}">Reset your Ten Talents Academy password</a>. The link works once and expires in 24 hours.</p>
<p>If you didn't ask for this, you can ignore it.</p>`;
}
