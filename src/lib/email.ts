import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: "Dock Scheduling <onboarding@resend.dev>",
    to,
    subject: "Reset your Dock Scheduling password",
    html: `
      <p>Someone requested a password reset for this Dock Scheduling account.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}
