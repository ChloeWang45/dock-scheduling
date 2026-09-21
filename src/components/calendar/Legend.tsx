export default function Legend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-ink/70">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-confirmed" /> Confirmed
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-tentative" /> Tentative
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-ink/30" /> Cancelled
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-wave" /> Event
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-hazard-stripe" /> Closure
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm border-2 border-conflict bg-transparent" /> Overridden
      </span>
    </div>
  );
}
