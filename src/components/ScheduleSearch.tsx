export default function ScheduleSearch({ q, type }: { q: string; type: string }) {
  return (
    <form action="/schedule" method="GET" className="mb-4 flex items-center gap-2">
      {type !== "all" && <input type="hidden" name="type" value={type} />}
      <input
        type="text"
        name="sq"
        defaultValue={q}
        placeholder="Search bookings, events, closures…"
        className="w-72 text-input"
      />
      <button type="submit" className="btn-secondary">
        Search
      </button>
      {q && (
        <a
          href={type === "all" ? "/schedule" : `/schedule?type=${type}`}
          className="muted-link"
        >
          Clear
        </a>
      )}
    </form>
  );
}
