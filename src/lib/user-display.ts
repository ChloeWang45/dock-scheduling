const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  viewer: "Viewer",
};

export function formatStaffName(name: string, title: string | null, role: string): string {
  const parenthetical = title?.trim() || ROLE_LABELS[role] || role;
  return `${name} (${parenthetical})`;
}
