export default function CalendarSearch({
  q,
  view,
  anchor,
}: {
  q: string;
  view: string;
  anchor: string;
}) {
  return (
    <form action="/calendar" method="GET" className="mb-4 flex items-center gap-2">
      <input type="hidden" name="view" value={view} />
      <input type="hidden" name="date" value={anchor} />
      <input
        type="text"
        name="q"
        defaultValue={q}
        placeholder="Search bookings, events, closures…"
        className="w-72 rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <button
        type="submit"
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Search
      </button>
      {q && (
        <a
          href={`/calendar?view=${view}&date=${anchor}`}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          Clear
        </a>
      )}
    </form>
  );
}
