export default function Legend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-green-500" /> Confirmed
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-amber-500" /> Tentative
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-zinc-400" /> Cancelled
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm border-2 border-red-500 bg-transparent" /> Overridden
      </span>
    </div>
  );
}
