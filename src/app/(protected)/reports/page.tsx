import { getUsageReport } from "@/lib/usage-report";

export default async function ReportsPage() {
  const { years, berths, days, totalsByYear } = await getUsageReport();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Usage Report
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Days per berth per year with at least one active booking, event, or closure.
          Replaces the hand-tallied &quot;8YR Dock Summary&quot; tab — a day counts once even if
          multiple entries overlap it.
        </p>
      </div>

      {years.length === 0 ? (
        <p className="text-sm text-zinc-500">No data yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 font-medium">Berth</th>
                {years.map((year) => (
                  <th key={year} className="px-4 py-2 text-right font-medium">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {berths.map((berth) => (
                <tr key={berth.id} className="text-zinc-800 dark:text-zinc-200">
                  <td className="px-4 py-2">
                    {berth.name}
                    {!berth.active && (
                      <span className="ml-2 text-xs text-zinc-400">(inactive)</span>
                    )}
                  </td>
                  {years.map((year) => (
                    <td key={year} className="px-4 py-2 text-right">
                      {days[berth.id]?.[year] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-zinc-300 font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
                <td className="px-4 py-2">Total Days</td>
                {years.map((year) => (
                  <td key={year} className="px-4 py-2 text-right">
                    {totalsByYear[year]}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
