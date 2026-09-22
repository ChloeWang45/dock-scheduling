import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/authz";
import { approveUser, changeUserRole, denyUser } from "@/app/(protected)/admin/users/actions";
import { compareByTextRelevance, matchesText } from "@/lib/text-search";
import ListSearch from "@/components/ListSearch";

const selectClass = "rounded border border-ink/20 bg-white px-2 py-1 text-sm text-ink";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ uq?: string }>;
}) {
  const currentUser = await requireAdmin();
  const { uq: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();
  let allUsers = await db.select().from(users).orderBy(asc(users.createdAt));
  if (q) {
    const fieldsOf = (u: (typeof allUsers)[number]) => [u.name, u.email, u.role];
    allUsers = allUsers.filter((u) => matchesText(fieldsOf(u), q)).sort(compareByTextRelevance(fieldsOf, q));
  }

  const pending = allUsers.filter((u) => u.status === "pending");
  const approved = allUsers.filter((u) => u.status === "approved");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="page-title">Users</h1>
        <p className="mt-1 text-sm text-ink/60">
          Approve new signups and manage roles.
        </p>
      </div>

      <ListSearch action="/admin/users" paramName="uq" q={q} placeholder="Search users…" />

      <div>
        <h2 className="mb-4 section-title">
          Pending approval {pending.length > 0 && `(${pending.length})`}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-ink/60">No pending signups.</p>
        ) : (
          <div className="table-shell">
            <table className="w-full text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Signed up</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="table-divide">
                {pending.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-2">
                      {u.name}
                      {u.title && <span className="text-ink/60"> ({u.title})</span>}
                    </td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <form
                        action={approveUser.bind(null, u.id)}
                        className="flex items-center justify-end gap-2"
                      >
                        <select name="role" defaultValue="viewer" className={selectClass}>
                          <option value="viewer">Viewer</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          className="btn-primary"
                        >
                          Approve
                        </button>
                        <button
                          formAction={denyUser.bind(null, u.id)}
                          className="btn-secondary"
                        >
                          Deny
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 section-title">
          All users ({approved.length})
        </h2>
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="table-divide">
              {approved.map((u) => (
                <tr key={u.id} className="table-row">
                  <td className="px-4 py-2">
                    {u.name}
                    {u.title && <span className="text-ink/60"> ({u.title})</span>}
                  </td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2 capitalize">{u.role}</td>
                  <td className="px-4 py-2 text-right">
                    {u.id === currentUser.id ? (
                      <span className="text-xs text-ink/40">(you)</span>
                    ) : (
                      <form
                        action={changeUserRole.bind(null, u.id)}
                        className="flex items-center justify-end gap-2"
                      >
                        <select name="role" defaultValue={u.role} className={selectClass}>
                          <option value="viewer">Viewer</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          className="btn-secondary"
                        >
                          Update
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
