import { getUsageReport } from "@/lib/usage-report";

export default async function ReportsPage() {
  const { years, berths, days, totalsByYear } = await getUsageReport();

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">
          Usage Report
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Days per berth per year with at least one active booking, event, or closure.
          A day counts once even if multiple entries overlap it.
        </p>
      </div>

      {years.length === 0 ? (
        <p className="text-sm text-ink/60">No data yet.</p>
      ) : (
        <div className="table-shell-x">
          <table className="w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-2 font-medium">Berth</th>
                {years.map((year) => (
                  <th key={year} className="px-4 py-2 text-right font-medium">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="table-divide">
              {berths.map((berth) => (
                <tr key={berth.id} className="table-row">
                  <td className="px-4 py-2">
                    {berth.name}
                    {!berth.active && (
                      <span className="ml-2 text-xs text-ink/40">(inactive)</span>
                    )}
                  </td>
                  {years.map((year) => (
                    <td key={year} className="px-4 py-2 text-right">
                      {days[berth.id]?.[year] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-ink/20 font-semibold text-ink">
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
