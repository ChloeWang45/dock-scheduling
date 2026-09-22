"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

export type SignUpState = { error: string } | undefined;

export async function signUp(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!firstName || !email || !password) {
    return { error: "First name, email, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const name = [firstName, lastName].filter(Boolean).join(" ");
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.insert(users).values({
      name,
      firstName,
      lastName,
      title,
      email,
      passwordHash,
      role: "viewer",
      status: "pending",
    });
  } catch (err) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      return { error: "An account with that email already exists." };
    }
    throw err;
  }

  redirect("/login?signedUp=1");
}
