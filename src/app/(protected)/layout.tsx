import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import AppShell from "@/components/AppShell";

export default async function ProtectedLayout({
  main,
  panel,
}: {
  main: React.ReactNode;
  panel: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Read the name fresh from the DB (rather than the JWT session, which is
  // only re-issued at login) so a profile edit shows up immediately.
  const [currentUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell
      main={main}
      panel={panel}
      role={session.user.role}
      userName={currentUser?.name ?? session.user.email ?? ""}
      userEmail={session.user.email ?? ""}
      logout={logout}
    />
  );
}
