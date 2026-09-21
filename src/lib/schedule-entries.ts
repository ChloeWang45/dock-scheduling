import { eq } from "drizzle-orm";
import { db } from "@/db";
import { berths, bookings, closures, events, users, vessels } from "@/db/schema";
import { formatStaffName } from "@/lib/user-display";

export type EntryType = "booking" | "event" | "closure";

export type ScheduleEntry = {
  id: string;
  type: EntryType;
  berthName: string;
  title: string; // vessel name / event name / "Closed: <reason>"
  subtitle: string | null; // operator / organizer / null
  startDate: string;
  endDate: string;
  seriesId: string | null;
  staffLabel: string;
  statusLabel: string;
  statusClass: string;
  overridden: boolean;
  isCancellable: boolean;
  editHref: string;
};

const STATUS_CLASS = {
  active: "text-green-700 dark:text-green-400",
  tentative: "text-amber-700 dark:text-amber-400",
  cancelled: "text-zinc-400",
  closed: "text-red-700 dark:text-red-400",
};

export async function getScheduleEntries(): Promise<ScheduleEntry[]> {
  const [bookingRows, eventRows, closureRows] = await Promise.all([
    db
      .select({
        id: bookings.id,
        berthName: berths.name,
        vesselName: vessels.name,
        operator: vessels.operator,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        status: bookings.status,
        overridden: bookings.overridden,
        seriesId: bookings.seriesId,
        staffName: users.name,
        staffTitle: users.title,
        staffRole: users.role,
      })
      .from(bookings)
      .innerJoin(berths, eq(bookings.berthId, berths.id))
      .innerJoin(vessels, eq(bookings.vesselId, vessels.id))
      .innerJoin(users, eq(bookings.createdByStaffId, users.id)),
    db
      .select({
        id: events.id,
        berthName: berths.name,
        name: events.name,
        organizer: events.organizer,
        startDate: events.startDate,
        endDate: events.endDate,
        active: events.active,
        overridden: events.overridden,
        seriesId: events.seriesId,
        staffName: users.name,
        staffTitle: users.title,
        staffRole: users.role,
      })
      .from(events)
      .innerJoin(berths, eq(events.berthId, berths.id))
      .innerJoin(users, eq(events.createdByStaffId, users.id)),
    db
      .select({
        id: closures.id,
        berthName: berths.name,
        reason: closures.reason,
        startDate: closures.startDate,
        endDate: closures.endDate,
        active: closures.active,
        overridden: closures.overridden,
        seriesId: closures.seriesId,
        staffName: users.name,
        staffTitle: users.title,
        staffRole: users.role,
      })
      .from(closures)
      .innerJoin(berths, eq(closures.berthId, berths.id))
      .innerJoin(users, eq(closures.createdByStaffId, users.id)),
  ]);

  const entries: ScheduleEntry[] = [
    ...bookingRows.map((b) => ({
      id: b.id,
      type: "booking" as const,
      berthName: b.berthName,
      title: b.vesselName,
      subtitle: b.operator,
      startDate: b.startDate,
      endDate: b.endDate,
      seriesId: b.seriesId,
      staffLabel: formatStaffName(b.staffName, b.staffTitle, b.staffRole),
      statusLabel: b.status,
      statusClass:
        b.status === "confirmed"
          ? STATUS_CLASS.active
          : b.status === "tentative"
            ? STATUS_CLASS.tentative
            : STATUS_CLASS.cancelled,
      overridden: b.overridden,
      isCancellable: b.status !== "cancelled",
      editHref: `/bookings/${b.id}/edit`,
    })),
    ...eventRows.map((e) => ({
      id: e.id,
      type: "event" as const,
      berthName: e.berthName,
      title: e.name,
      subtitle: e.organizer,
      startDate: e.startDate,
      endDate: e.endDate,
      seriesId: e.seriesId,
      staffLabel: formatStaffName(e.staffName, e.staffTitle, e.staffRole),
      statusLabel: e.active ? "active" : "cancelled",
      statusClass: e.active ? STATUS_CLASS.active : STATUS_CLASS.cancelled,
      overridden: e.overridden,
      isCancellable: e.active,
      editHref: `/events/${e.id}/edit`,
    })),
    ...closureRows.map((c) => ({
      id: c.id,
      type: "closure" as const,
      berthName: c.berthName,
      title: `Closed: ${c.reason}`,
      subtitle: null,
      startDate: c.startDate,
      endDate: c.endDate,
      seriesId: c.seriesId,
      staffLabel: formatStaffName(c.staffName, c.staffTitle, c.staffRole),
      statusLabel: c.active ? "closed" : "cancelled",
      statusClass: c.active ? STATUS_CLASS.closed : STATUS_CLASS.cancelled,
      overridden: c.overridden,
      isCancellable: c.active,
      editHref: `/closures/${c.id}/edit`,
    })),
  ];

  entries.sort((a, b) => b.startDate.localeCompare(a.startDate));
  return entries;
}
