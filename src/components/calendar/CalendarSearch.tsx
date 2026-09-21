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
        className="w-72 text-input"
      />
      <button
        type="submit"
        className="btn-secondary"
      >
        Search
      </button>
      {q && (
        <a
          href={`/calendar?view=${view}&date=${anchor}`}
          className="muted-link"
        >
          Clear
        </a>
      )}
    </form>
  );
}
