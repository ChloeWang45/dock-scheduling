"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (email) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (user) {
      const rawToken = await createResetToken(user.id);
      const headerList = await headers();
      const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
      const proto = headerList.get("x-forwarded-proto") ?? "https";
      const resetUrl = `${proto}://${host}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }
  }

  // Always the same outcome, whether or not that email has an account —
  // otherwise the response would leak which emails are registered.
  redirect("/forgot-password?sent=1");
}
