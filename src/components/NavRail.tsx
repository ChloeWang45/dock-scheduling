"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnchorIcon,
  BoatIcon,
  ChartIcon,
  CompassIcon,
  ExitIcon,
  GearIcon,
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
  userName,
  userEmail,
  logout,
}: {
  role: "admin" | "staff" | "viewer";
  userName: string;
  userEmail: string;
  logout: () => void;
}) {
  const pathname = usePathname();

  const items = [...RAIL_ITEMS];
  if (role === "admin") {
    items.push({ href: "/admin/users", label: "Users", icon: PeopleIcon });
    items.push({ href: "/settings", label: "Settings", icon: GearIcon });
  }

  return (
    <>
      {/* Desktop: collapsed icon rail, expands on hover */}
      <nav className="group hidden h-screen w-14 shrink-0 flex-col justify-between overflow-hidden border-r border-ink/15 bg-abyss text-ink-inverse transition-[width] duration-200 ease-out hover:w-48 md:flex">
        <div className="flex flex-col gap-1 py-4">
          <Link
            href="/calendar"
            className="flex items-center gap-3 px-4 py-2 text-ink-inverse"
            title="WHOI Docking Schedule"
          >
            <CompassIcon className="h-6 w-6 shrink-0" />
            <span className="font-display text-xs tracking-wide whitespace-nowrap uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
                    active
                      ? "bg-wave text-ink-inverse"
                      : "text-ink-inverse/70 hover:bg-white/10 hover:text-ink-inverse"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium tracking-wide whitespace-nowrap uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
              {userName}
            </span>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-ink-inverse/70 transition-colors duration-150 hover:bg-white/10 hover:text-ink-inverse"
            >
              <ExitIcon className="h-5 w-5 shrink-0" />
              <span className="text-xs font-medium tracking-wide whitespace-nowrap uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Sign out
              </span>
            </button>
          </form>
        </div>
      </nav>

      {/* Mobile: horizontal, scrollable icon bar */}
      <nav className="flex w-full shrink-0 items-stretch overflow-x-auto border-b border-ink/15 bg-abyss text-ink-inverse md:hidden">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 flex-col items-center gap-1 px-4 py-2 transition-colors duration-150 ${
                active ? "bg-wave text-ink-inverse" : "text-ink-inverse/70"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium tracking-wide whitespace-nowrap uppercase">
                {label}
              </span>
            </Link>
          );
        })}
        <Link
          href="/account"
          className={`flex shrink-0 flex-col items-center gap-1 px-4 py-2 transition-colors duration-150 ${
            pathname === "/account" ? "bg-wave text-ink-inverse" : "text-ink-inverse/70"
          }`}
        >
          <CompassIcon className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium tracking-wide whitespace-nowrap uppercase">
            Account
          </span>
        </Link>
        <form action={logout} className="flex shrink-0">
          <button
            type="submit"
            className="flex shrink-0 flex-col items-center gap-1 px-4 py-2 text-ink-inverse/70 transition-colors duration-150"
          >
            <ExitIcon className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-medium tracking-wide whitespace-nowrap uppercase">
              Sign out
            </span>
          </button>
        </form>
      </nav>
    </>
  );
}
