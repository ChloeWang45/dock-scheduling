import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { berths, bookings, closures, events, vessels } from "@/db/schema";
import { buildIcsCalendar, type IcsEvent } from "@/lib/ical";

export async function getBerthFeed(berthId: string): Promise<{ name: string; events: IcsEvent[] } | null> {
  const [berth] = await db.select().from(berths).where(eq(berths.id, berthId)).limit(1);
  if (!berth) return null;

  const [bookingRows, eventRows, closureRows] = await Promise.all([
    db
      .select({
        id: bookings.id,
        vesselName: vessels.name,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        notes: bookings.notes,
      })
      .from(bookings)
      .innerJoin(vessels, eq(bookings.vesselId, vessels.id))
      .where(and(eq(bookings.berthId, berthId), ne(bookings.status, "cancelled"))),
    db
      .select({ id: events.id, name: events.name, startDate: events.startDate, endDate: events.endDate, notes: events.notes })
      .from(events)
      .where(and(eq(events.berthId, berthId), eq(events.active, true))),
    db
      .select({ id: closures.id, reason: closures.reason, startDate: closures.startDate, endDate: closures.endDate })
      .from(closures)
      .where(and(eq(closures.berthId, berthId), eq(closures.active, true))),
  ]);

  const icsEvents: IcsEvent[] = [
    ...bookingRows.map((b) => ({
      uid: `booking-${b.id}@dock-scheduling`,
      summary: `Booking: ${b.vesselName}`,
      description: b.notes,
      startDate: b.startDate,
      endDate: b.endDate,
    })),
    ...eventRows.map((e) => ({
      uid: `event-${e.id}@dock-scheduling`,
      summary: `Event: ${e.name}`,
      description: e.notes,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    ...closureRows.map((c) => ({
      uid: `closure-${c.id}@dock-scheduling`,
      summary: `Closure: ${c.reason}`,
      startDate: c.startDate,
      endDate: c.endDate,
    })),
  ];

  return { name: berth.name, events: icsEvents };
}

export async function getVesselFeed(vesselId: string): Promise<{ name: string; events: IcsEvent[] } | null> {
  const [vessel] = await db.select().from(vessels).where(eq(vessels.id, vesselId)).limit(1);
  if (!vessel) return null;

  const bookingRows = await db
    .select({
      id: bookings.id,
      berthName: berths.name,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      notes: bookings.notes,
    })
    .from(bookings)
    .innerJoin(berths, eq(bookings.berthId, berths.id))
    .where(and(eq(bookings.vesselId, vesselId), ne(bookings.status, "cancelled")));

  const icsEvents: IcsEvent[] = bookingRows.map((b) => ({
    uid: `booking-${b.id}@dock-scheduling`,
    summary: `${vessel.name} @ ${b.berthName}`,
    description: b.notes,
    startDate: b.startDate,
    endDate: b.endDate,
  }));

  return { name: vessel.name, events: icsEvents };
}

export async function getAllFeed(): Promise<{ name: string; events: IcsEvent[] }> {
  const [bookingRows, eventRows, closureRows] = await Promise.all([
    db
      .select({
        id: bookings.id,
        berthName: berths.name,
        vesselName: vessels.name,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        notes: bookings.notes,
      })
      .from(bookings)
      .innerJoin(berths, eq(bookings.berthId, berths.id))
      .innerJoin(vessels, eq(bookings.vesselId, vessels.id))
      .where(ne(bookings.status, "cancelled")),
    db
      .select({
        id: events.id,
        berthName: berths.name,
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate,
        notes: events.notes,
      })
      .from(events)
      .innerJoin(berths, eq(events.berthId, berths.id))
      .where(eq(events.active, true)),
    db
      .select({
        id: closures.id,
        berthName: berths.name,
        reason: closures.reason,
        startDate: closures.startDate,
        endDate: closures.endDate,
      })
      .from(closures)
      .innerJoin(berths, eq(closures.berthId, berths.id))
      .where(eq(closures.active, true)),
  ]);

  const icsEvents: IcsEvent[] = [
    ...bookingRows.map((b) => ({
      uid: `booking-${b.id}@dock-scheduling`,
      summary: `${b.berthName}: Booking — ${b.vesselName}`,
      description: b.notes,
      startDate: b.startDate,
      endDate: b.endDate,
    })),
    ...eventRows.map((e) => ({
      uid: `event-${e.id}@dock-scheduling`,
      summary: `${e.berthName}: Event — ${e.name}`,
      description: e.notes,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    ...closureRows.map((c) => ({
      uid: `closure-${c.id}@dock-scheduling`,
      summary: `${c.berthName}: Closure — ${c.reason}`,
      startDate: c.startDate,
      endDate: c.endDate,
    })),
  ];

  return { name: "Dock Schedule — All Berths", events: icsEvents };
}

export function icsResponse(calendarName: string, events: IcsEvent[]): Response {
  const body = buildIcsCalendar(calendarName, events);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}
