import Link from "next/link";
import type { BerthRow, BookingBlock } from "./BerthDayGrid";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function monthRange(year: string, monthIndex: number): [string, string] {
  const start = `${year}-${pad(monthIndex + 1)}-01`;
  const lastDay = new Date(Date.UTC(Number(year), monthIndex + 1, 0)).getUTCDate();
  const end = `${year}-${pad(monthIndex + 1)}-${pad(lastDay)}`;
  return [start, end];
}

function intensityClass(count: number) {
  if (count === 0) return "bg-transparent text-zinc-300 dark:text-zinc-700";
  if (count <= 2) return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
  if (count <= 5) return "bg-green-300 text-green-900 dark:bg-green-800 dark:text-green-100";
  return "bg-green-500 text-white dark:bg-green-600";
}

export default function YearGrid({
  year,
  berths,
  bookings,
}: {
  year: string;
  berths: BerthRow[];
  bookings: BookingBlock[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-zinc-100 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Berth</th>
            {MONTH_LABELS.map((m) => (
              <th key={m} className="px-2 py-2 text-center font-medium">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {berths.map((berth) => (
            <tr key={berth.id}>
              <td className="px-3 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                {berth.name}
              </td>
              {MONTH_LABELS.map((_, monthIndex) => {
                const [start, end] = monthRange(year, monthIndex);
                const count = bookings.filter(
                  (b) => b.berthId === berth.id && b.startDate <= end && b.endDate >= start,
                ).length;
                return (
                  <td key={monthIndex} className="px-1 py-1 text-center">
                    <Link
                      href={`/calendar?view=month&date=${start}`}
                      className={`block rounded py-1.5 text-xs font-medium ${intensityClass(count)}`}
                    >
                      {count > 0 ? count : "–"}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
