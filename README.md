# WHOI Docking Schedule

A dock/berth scheduling system built for a Woods Hole Oceanographic
Institution–style marine research facility. It replaces a hand-maintained
spreadsheet with a live calendar, structural double-booking prevention,
vessel/berth fit checking, recurring bookings, role-based access, search,
usage reporting, and subscribable iCal feeds.

Live deployment: https://dock-scheduling-three.vercel.app

## Table of contents

- [Tech stack](#tech-stack)
- [Core concepts](#core-concepts)
- [Feature tour](#feature-tour)
- [Layout & design system](#layout--design-system)
- [Project structure](#project-structure)
- [Database schema](#database-schema)
- [Auth & roles](#auth--roles)
- [Environment variables](#environment-variables)
- [Local development](#local-development)
- [Database migrations](#database-migrations)
- [Historical & synthetic data](#historical--synthetic-data)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions, parallel routes) |
| Language | TypeScript, React 19 |
| Database | [Neon](https://neon.tech) serverless Postgres |
| ORM | [Drizzle ORM](https://orm.drizzle.team) (`neon-http` driver) |
| Auth | [Auth.js / NextAuth v5](https://authjs.dev), credentials provider, JWT sessions |
| Email | [Resend](https://resend.com) (password-reset emails only) |
| Styling | Tailwind CSS v4 |
| Hosting | Vercel |

No test framework, no client-side state library, no CSS-in-JS — data
fetching is server-side per request, mutations are Server Actions, and the
handful of client components that need interactivity (nav rail, resizable
panel, search inputs with hidden fields) are marked `"use client"`
explicitly.

## Core concepts

The facility has a fixed set of **berths** (physical docking spots) and a
fleet of **vessels** (ships that get booked into berths). Three kinds of
things occupy a berth over a date range:

- **Bookings** — a vessel occupies a berth (`confirmed`, `tentative`, or
  `cancelled`).
- **Events** — a non-vessel occupation of a berth (e.g. a dive-training day
  or a donor reception), with an organizer instead of a vessel.
- **Closures** — the berth is unavailable to everyone (maintenance,
  dredging, etc.), regardless of how many vessels the berth can normally
  hold.

All three can **recur** (daily/weekly/monthly, ending after N occurrences
or on a date) via a shared `recurrence_series` table — each occurrence is a
real row sharing a `seriesId`, not a virtually-computed date; that's what
lets an individual occurrence be edited, cancelled, or overridden on its
own without touching the rest of the series.

### Conflict prevention is structural, not just a form check

Double-booking prevention doesn't rely solely on application code. A
`berth_occupancy_ledger` table is kept in sync with bookings/events/closures
via Postgres triggers (`drizzle/0005_add_occupancy_ledger_triggers.sql`),
and two `EXCLUDE USING gist` constraints on that table enforce the rules at
the database level:

- `ledger_exclusive_no_overlap` — on a single-occupant berth, no two active
  entries (booking, event, or closure, in any combination) may overlap.
- `ledger_closure_blocks_occupant` — even on a multi-occupant berth, a
  closure still blocks every occupant type (a closure isn't a capacity
  slot; it blocks the whole berth).

This exists because a single Postgres table can only have an exclusion
constraint against rows in *that* table — bookings, events, and closures
are separate tables, so the shared ledger is what lets one pair of
constraints reason about all three at once.

The application layer (`src/lib/berth-conflict.ts`) queries the same
ledger *before* attempting an insert, so the UI can show a friendly
conflict message instead of surfacing a raw constraint violation. Both
layers exist deliberately: the DB constraint is the real guarantee (it
can't be bypassed by a bug in the app), the app-level check is what makes
the failure legible.

A conflicting or fit-violating entry can still be saved if the user checks
**"override"** and supplies a justification note (`overridden` +
`overrideNote` columns) — this is meant for real-world exceptions (e.g. a
short raft-alongside that the harbor master has explicitly allowed).

### Fit checking

`src/lib/booking-validation.ts` checks a vessel's LOA/beam/draft against a
berth's length/width/depth-at-low-tide, with a buffer/margin on each check
(LOA buffer %, beam buffer %, under-keel-clearance margin in ft). Missing
dimensions on either side produce an "unverified" notice rather than
blocking the save — only an actual measured violation blocks it (subject
to override, as above).

The three values are configurable at two levels:

- **Facility-wide defaults** — editable by admins at `/settings`, stored
  in the single-row `fit_settings` table (`src/lib/fit-settings.ts`).
  Ship with the historical hardcoded values (15% / 15% / 1 ft) until an
  admin changes them.
- **Per-berth overrides** — the `loaBufferPct`/`beamBufferPct`/
  `ukcMarginFt` columns already on `berths`, editable on a berth's own
  edit page; a blank value there falls back to the facility default.

## Feature tour

- **Calendar** (`/calendar`) — day/week/month/year views of every berth's
  occupancy, color-coded by status (confirmed/tentative/cancelled/event),
  with closures rendered as a diagonal hazard stripe rather than a flat
  color (a nod to real maritime hazard-marking convention). Hovering an
  occupancy bar pops up its vessel/event/closure name, dates, status, and
  who booked it. The calendar is the permanent "home" screen — see
  [Layout & design system](#layout--design-system).
- **Schedule** (`/schedule`) — a single list of every booking/event/closure,
  filterable by type, with recurring series collapsed to their soonest
  occurrence behind a "show N other occurrences" toggle
  (`src/lib/group-series.ts` + `SeriesGroup.tsx`).
- **New entry** (`/schedule/new`) — one form with a type switcher
  (Booking/Event/Closure) instead of three separate creation flows.
- **Berths / Vessels** (`/berths`, `/vessels`) — CRUD with dimensions,
  active/inactive toggling (records are deactivated, never deleted, since
  bookings reference them).
- **Search** — available on Calendar, Schedule, Berths, Vessels, and Users.
  Calendar/Schedule search (`src/lib/search-entries.ts`) ranks results by
  relevance to the query first (exact match on title > starts-with >
  contains > match on a secondary field) and by closeness to today second,
  and groups recurring series the same way the plain list does. Berths/
  Vessels/Users search (`src/lib/text-search.ts`) ranks by the same
  relevance idea across their own fields (name/type/operator,
  name/email/role). Each search box uses its own query-string parameter
  (`q`, `sq`, `bq`, `vq`, `uq`) so they don't collide — the calendar is
  always rendered alongside whatever panel is open (see below) and reads
  its own `q`, so a panel's search box needed a different name to avoid
  accidentally flipping the calendar into search mode too.
- **Usage report** (`/reports`) — occupied days per berth per year (a day
  counts once even if multiple entries overlap it), computed via
  `generate_series` + `COUNT(DISTINCT day)` SQL rather than summing range
  lengths, specifically to avoid double-counting overlaps.
- **iCal feeds** (`/feeds`) — subscribable `.ics` links per berth, per
  vessel, or for everything combined. No login is required to fetch a feed
  URL (calendar apps can't do interactive auth); instead each link is
  gated by an HMAC token derived from `AUTH_SECRET`
  (`src/lib/ical.ts::feedToken`), so no extra secrets table or schema
  migration was needed and a URL can't be forged without the server's
  secret.
- **Account & auth** — signup requires admin approval before login works;
  first/last name (kept in sync with a combined `name` column that the
  rest of the app reads); change password; forgot-password emails a
  one-hour single-use reset link via Resend (token stored as a SHA-256
  hash, never in plaintext).
- **Admin → Users** (`/admin/users`) — approve/deny pending signups, change
  roles. There is no "delete an approved user" feature — see
  [Known limitations](#known-limitations).
- **Admin → Settings** (`/settings`) — facility-wide fit-check defaults
  (LOA buffer %, beam buffer %, under-keel-clearance margin); see
  [Fit checking](#core-concepts).

## Layout & design system

The calendar is treated as the application's permanent home base — other
sections don't navigate away from it, they open as a **resizable panel**
beside it.

- **Nav rail** (`src/components/NavRail.tsx`) — a collapsed icon-only rail
  on desktop that expands on hover to show labels; on mobile (`<768px`)
  it becomes a horizontal, swipeable icon bar instead (hover doesn't exist
  on touch).
- **Panel + calendar split** (`src/components/AppShell.tsx`) — implemented
  with **Next.js parallel routes**: the `(protected)` layout has two named
  slots, `@main` (always renders the calendar, via its own `default.tsx`
  fallback that matches every path) and `@panel` (resolves to whichever
  section's page matches the current URL, or renders `null` — see
  `@panel/default.tsx` and the explicit `@panel/calendar/page.tsx`
  no-op — visiting `/calendar` needs *some* real route in the `@panel`
  subtree for Next.js to recognize the URL as valid on a hard navigation).
  This is what lets clicking "Vessels" swap the panel's content without
  the calendar remounting or losing its current date/view.
  - On desktop, the panel sits to the left of the calendar with a
    drag-to-resize divider (width persisted to `localStorage`).
  - On mobile, the panel stacks *above* the calendar and both flow in one
    page scroll, rather than squeezing into an unreadable side-by-side
    split.
  - Tables that don't fit their container scroll horizontally
    (`.table-shell` in `globals.css`) instead of clipping — so
    Edit/Deactivate/Cancel controls are always reachable by scrolling
    instead of requiring a wider window.
- **Visual design** is intentionally styled after WHOI's real public
  website (whoi.edu): navy/wave/foam ocean color palette (defined as CSS
  custom properties in `globals.css` and wired into Tailwind's `@theme`),
  **Oswald** for big condensed uppercase headings and **Red Hat Display**
  for body/UI text — these are the exact free fallback fonts whoi.edu's
  own stylesheet declares for its licensed TideSans/Dharma Gothic fonts
  (which aren't available to embed), loaded from Google Fonts. Buttons and
  filter tabs are pill-shaped, uppercase, and letter-spaced, matching
  WHOI's actual button convention. A persistent navy "WHOI Docking
  Schedule" banner (`TopBanner.tsx`) sits above everything, including the
  login/signup/password pages.

## Project structure

```
src/
  app/
    (protected)/
      layout.tsx          # auth check; renders AppShell with the @main/@panel slots
      @main/default.tsx   # the calendar — rendered for every path (see above)
      @panel/              # every other section, one folder per route
        berths/, vessels/, schedule/, reports/, feeds/, admin/users/, account/
        default.tsx        # renders null — "no panel open"
        calendar/page.tsx   # renders null — makes /calendar itself a valid route
      berths/actions.ts, vessels/actions.ts, bookings/actions.ts,
      events/actions.ts, closures/actions.ts, admin/users/actions.ts,
      account/actions.ts   # Server Actions, kept outside the @panel slot
                            # since they're plain modules, not routes
    api/
      auth/[...nextauth]/route.ts   # NextAuth handler
      ical/all/[token]/, ical/berth/[id]/[token]/, ical/vessel/[id]/[token]/
    login/, signup/, forgot-password/, reset-password/   # public auth pages
  components/
    AppShell.tsx, NavRail.tsx, TopBanner.tsx, icons.tsx   # app chrome
    calendar/                                              # BerthDayGrid, YearGrid, CalendarNav, CalendarSearch, Legend
    BookingForm.tsx, EventForm.tsx, ClosureForm.tsx,
    RecurrenceFields.tsx, ScheduleNewForm.tsx               # entry forms
    BerthForm.tsx, VesselForm.tsx, AccountForms.tsx
    SeriesGroup.tsx, ScheduleSearch.tsx, ListSearch.tsx, CopyFeedLink.tsx
  lib/
    berth-conflict.ts      # ledger-based overlap/capacity/closure checks
    booking-validation.ts  # LOA/beam/draft fit checking
    recurrence.ts          # occurrence generation from a recurrence rule
    group-series.ts        # collapses a series to its soonest occurrence
    schedule-entries.ts    # unifies bookings/events/closures into one shape
    search-entries.ts, text-search.ts   # relevance ranking for search
    usage-report.ts         # occupied-days-per-berth-per-year SQL
    ical.ts, ical-feeds.ts  # .ics generation + feed token scheme
    password-reset.ts, email.ts   # forgot-password flow
    calendar-dates.ts, calendar-lanes.ts   # date math + occupancy-bar lane assignment
    authz.ts                # requireUser/requireStaff/requireAdmin/canWrite
    user-display.ts         # "Name (Title)" formatting
  db/
    schema.ts   # Drizzle schema — the source of truth for the data model
    index.ts    # Neon HTTP client + Drizzle instance
    seed.ts     # seeds an admin user + starter berths/vessels
  auth.ts        # NextAuth config (credentials provider, JWT callbacks)
drizzle/          # SQL migrations (0000–0011) + drizzle-kit snapshots
scripts/          # one-off data scripts (see Historical & synthetic data)
```

## Database schema

Defined in `src/db/schema.ts`; see that file for the exact columns. Tables:

| Table | Purpose |
| --- | --- |
| `users` | Accounts. `role` (`admin`/`staff`/`viewer`), `status` (`pending`/`approved`). `name` is kept in sync with `first_name`/`last_name`. |
| `berths` | Physical docking spots: length/depth-at-low-tide/width, max simultaneous occupants, optional per-berth fit-check buffer overrides. |
| `vessels` | The fleet: type (`R/V`/`OSV`/`F/V`/`M/Y`/`Barge`), LOA/draft/beam, operator/contact. |
| `bookings`, `events`, `closures` | The three occupancy types (see [Core concepts](#core-concepts)). Each has `overridden`/`overrideNote` and an optional `seriesId`. |
| `recurrence_series` | One row per recurring series (frequency, interval, end condition). |
| `fit_settings` | Single-row (fixed id `"global"`) table holding the facility-wide fit-check defaults, editable at `/settings`. |
| `berth_occupancy_ledger` | Trigger-maintained mirror of active bookings/events/closures; carries the two exclusion constraints that make double-booking prevention structural. Application code only ever reads it. |
| `password_reset_tokens` | SHA-256-hashed, single-use, one-hour-expiry reset tokens. |

Role permissions (`src/lib/authz.ts`):

- **Viewer** — read-only.
- **Staff** — can create/edit/cancel bookings, events, closures, berths,
  vessels.
- **Admin** — everything Staff can do, plus approving/denying signups and
  changing roles.

## Auth & roles

Credentials-based login (email + password, bcrypt-hashed) via NextAuth v5,
JWT sessions. New signups land in `pending` status and can't log in until
an admin approves them and assigns a role (`/admin/users`). There is no
email-verification step — an account's email is never confirmed to
actually belong to the person who typed it; the only place that matters in
practice is forgot-password, since the reset link goes wherever the email
on file points.

## Environment variables

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (pooled). |
| `AUTH_SECRET` | NextAuth JWT signing secret — also used to derive iCal feed tokens. |
| `RESEND_API_KEY` | Sending password-reset emails. Without a verified domain on the Resend account, delivery is limited to the email address on that Resend account (Resend's sandbox-sender restriction) — fine for a single admin/tester, not yet for arbitrary users. |
| `SEED_ADMIN_EMAIL` (optional) | Overrides the default admin email `db:seed` creates/updates. |

Local development uses `.env.local` (gitignored). Production values live in
Vercel's project environment settings.

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`. You'll need `DATABASE_URL` and
`AUTH_SECRET` set (in `.env.local`) pointing at a real Postgres database —
there's no local/sqlite fallback. `RESEND_API_KEY` is only required if
you're testing the forgot-password flow.

To seed a starter admin user plus a handful of berths/vessels:

```bash
npm run db:seed
```

This prints a randomly generated admin password once — save it, it isn't
shown again. (`SEED_ADMIN_EMAIL` env var overrides the default admin
email.)

Other scripts:

```bash
npm run build       # production build (also runs the TypeScript check)
npm run lint         # ESLint
npm run db:studio    # Drizzle Studio, a GUI for browsing the live DB
```

## Database migrations

Schema changes are managed with Drizzle Kit:

```bash
npm run db:generate   # diff schema.ts against the last migration, write SQL
```

**Do not use `npm run db:push` on this project.** Several structural
pieces — the occupancy-ledger triggers, its generated `date_range` column,
and the exclusion constraints — were added by hand-written raw-SQL
migrations rather than through Drizzle's own schema DSL, since Drizzle has
no way to express `EXCLUDE USING gist` or trigger functions. `db:push`
diffs the *live database* against what `schema.ts` can express, doesn't
know about those hand-added pieces, and will offer to drop them. Instead,
apply generated (or hand-written) migration SQL directly against the
database — e.g. with a small script using the Neon client's
`sql.query(...)`, splitting the file on `--> statement-breakpoint` (see the
git history of `drizzle/0009_*.sql` and `0010_*.sql` for the pattern used
so far; the one-off runner scripts themselves weren't kept since they're
not reusable, just a way to execute the SQL once).

## Historical & synthetic data

The production database isn't just demo data — it's seeded from a real
historical sample spreadsheet plus data generated to match its patterns:

- `scripts/reseed-historical.ts` — the original 2017 season, parsed from
  the real sample spreadsheet.
- `scripts/import-2018-2019.ts` (+ `scripts/data/years_2018_2019.json`) —
  2018 and 2019, parsed from the same source, inserted additively.
- `scripts/generate-synthetic-2020-2026.ts` — 2020–2026 bookings/events/
  closures generated by sampling from the *empirical* berth, vessel,
  duration, and seasonal distributions observed in the real 2017–2019
  data (not arbitrary random values), so the density and shape of demand
  matches history while avoiding real berth-occupancy conflicts.

Berth lengths for North Pier West (410 ft) and North Pier East (240 ft)
are modeled on WHOI's real Iselin Dock (430 ft west face / 256 ft east
face, per WHOI's own published materials — see the Waterfront Improvement
Project one-pager). Vessel/berth depth, width, LOA, draft, and beam values
were filled in afterward using realistic marine-architecture ranges per
vessel type/class, anchored to the real dimensions already on file for
R/V Atlantis, R/V Sikuliaq, R/V Blue Heron, and R/V Hugh R. Sharp.

## Deployment

Hosted on Vercel, auto-deploying from the `main` branch. `npm run build`
runs the production build and TypeScript check — run it locally before
pushing anything schema- or type-sensitive. Environment variables are
configured in the Vercel project settings, not committed anywhere.

## Known limitations

- **No "delete an approved user" feature.** Every table that records who
  created something (`bookings`, `events`, `closures`,
  `recurrence_series`) has a foreign key to `users` with no cascade or
  set-null rule, so Postgres would reject deleting a user who has created
  anything, rather than silently orphaning or cascading. The only existing
  delete path (`denyUser`) is for *pending* signups, who by definition
  haven't created anything yet.
- **No email verification.** Signup accepts any email string; nothing
  confirms it's real or belongs to the signer. This only matters in
  practice for forgot-password, which emails whatever address is on file.
- **Resend sandbox sender.** Without a verified sending domain on the
  Resend account, password-reset emails can only be delivered to the
  email address on that Resend account itself — not to arbitrary users.
  Verify a domain in Resend to lift this.
- **iCal feed tokens aren't revocable individually.** They're derived
  deterministically from `AUTH_SECRET` plus the berth/vessel id (or the
  literal string `"all"`), so the only way to invalidate every feed URL at
  once is rotating `AUTH_SECRET` (which also invalidates every active
  login session).
