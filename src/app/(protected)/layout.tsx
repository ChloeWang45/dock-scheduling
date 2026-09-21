import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
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

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell
      main={main}
      panel={panel}
      role={session.user.role}
      userEmail={session.user.email ?? ""}
      logout={logout}
    />
  );
}
