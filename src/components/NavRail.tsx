"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnchorIcon,
  BoatIcon,
  ChartIcon,
  CompassIcon,
  ExitIcon,
  PeopleIcon,
  ScheduleIcon,
  WaveIcon,
} from "@/components/icons";

const RAIL_ITEMS = [
  { href: "/berths", label: "Berths", icon: AnchorIcon },
  { href: "/vessels", label: "Vessels", icon: BoatIcon },
  { href: "/schedule", label: "Schedule", icon: ScheduleIcon },
  { href: "/reports", label: "Reports", icon: ChartIcon },
  { href: "/feeds", label: "Feeds", icon: WaveIcon },
];

export default function NavRail({
  role,
  userEmail,
  logout,
}: {
  role: "admin" | "staff" | "viewer";
  userEmail: string;
  logout: () => void;
}) {
  const pathname = usePathname();

  const items = [...RAIL_ITEMS];
  if (role === "admin") {
    items.push({ href: "/admin/users", label: "Users", icon: PeopleIcon });
  }

  return (
    <nav className="group flex h-screen w-14 shrink-0 flex-col justify-between overflow-hidden border-r border-ink/15 bg-abyss text-ink-inverse transition-[width] duration-200 ease-out hover:w-48">
      <div className="flex flex-col gap-1 py-4">
        <Link
          href="/calendar"
          className="flex items-center gap-3 px-4 py-2 text-ink-inverse"
          title="WHOI Docking Schedule"
        >
          <CompassIcon className="h-6 w-6 shrink-0" />
          <span className="whitespace-nowrap font-display text-xs uppercase tracking-wide opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Docking Schedule
          </span>
        </Link>
        <div className="mt-4 flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 ${
                  active ? "bg-wave text-ink-inverse" : "text-ink-inverse/70 hover:bg-white/10 hover:text-ink-inverse"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap text-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t border-white/10 py-4">
        <Link
          href="/account"
          className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 ${
            pathname === "/account"
              ? "bg-wave text-ink-inverse"
              : "text-ink-inverse/70 hover:bg-white/10 hover:text-ink-inverse"
          }`}
          title={userEmail}
        >
          <CompassIcon className="h-5 w-5 shrink-0" />
          <span className="truncate text-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {userEmail}
          </span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-ink-inverse/70 transition-colors duration-150 hover:bg-white/10 hover:text-ink-inverse"
          >
            <ExitIcon className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap text-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Sign out
            </span>
          </button>
        </form>
      </div>
    </nav>
  );
}
