import { headers } from "next/headers";
import { db } from "@/db";
import { berths, vessels } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { feedToken } from "@/lib/ical";
import { CopyFeedLink } from "@/components/CopyFeedLink";

export default async function FeedsPage() {
  await requireUser();

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  const [berthRows, vesselRows] = await Promise.all([
    db.select().from(berths).orderBy(berths.name),
    db.select().from(vessels).orderBy(vessels.name),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Calendar Feeds</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Subscribe to these iCalendar (.ics) links from Google Calendar, Apple Calendar, or Outlook
          to keep a berth or vessel&apos;s schedule up to date automatically. Each link is private —
          don&apos;t share it publicly.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Everything
          </h2>
          <CopyFeedLink
            label="All berths"
            url={`${origin}/api/ical/all/${feedToken("all", "all")}`}
          />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            By berth
          </h2>
          <div className="space-y-2">
            {berthRows.map((b) => (
              <CopyFeedLink
                key={b.id}
                label={b.name}
                url={`${origin}/api/ical/berth/${b.id}/${feedToken("berth", b.id)}`}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            By vessel
          </h2>
          <div className="space-y-2">
            {vesselRows.map((v) => (
              <CopyFeedLink
                key={v.id}
                label={v.name}
                url={`${origin}/api/ical/vessel/${v.id}/${feedToken("vessel", v.id)}`}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
