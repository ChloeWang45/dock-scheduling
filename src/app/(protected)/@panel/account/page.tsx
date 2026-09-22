import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ProfileForm, PasswordForm } from "@/components/AccountForms";

export default async function AccountPage() {
  const session = await auth();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session!.user.id))
    .limit(1);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-6 page-title">
          Account
        </h1>
        <p className="mb-4 text-sm text-ink/60">
          {user.email} · {user.role}
        </p>
        <ProfileForm firstName={user.firstName} lastName={user.lastName} title={user.title} />
      </div>
      <div>
        <h2 className="mb-4 section-title">
          Change password
        </h2>
        <PasswordForm />
      </div>
    </div>
  );
}
