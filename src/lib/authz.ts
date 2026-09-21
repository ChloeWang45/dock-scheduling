import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

// Staff and Admin can create/edit/cancel records. Viewers are read-only.
export async function requireStaff() {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "staff") {
    redirect("/calendar");
  }
  return user;
}

// Only Admins can approve accounts or assign roles.
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/calendar");
  }
  return user;
}

export function canWrite(role: string): boolean {
  return role === "admin" || role === "staff";
}
