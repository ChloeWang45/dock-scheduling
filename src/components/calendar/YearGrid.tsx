import Link from "next/link";
import type { BerthRow, OccupancyBlock } from "./BerthDayGrid";

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
  if (count === 0) return "bg-transparent text-ink/25";
  if (count <= 2) return "bg-foam text-abyss";
  if (count <= 5) return "bg-wave/70 text-ink-inverse";
  return "bg-abyss text-ink-inverse";
}

export default function YearGrid({
  year,
  berths,
  blocks,
}: {
  year: string;
  berths: BerthRow[];
  blocks: OccupancyBlock[];
}) {
  return (
    <div className="table-shell-x">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="table-head text-xs">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Berth</th>
            {MONTH_LABELS.map((m) => (
              <th key={m} className="px-2 py-2 text-center font-medium">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-divide">
          {berths.map((berth) => (
            <tr key={berth.id}>
              <td className="px-3 py-2 font-medium table-row">
                {berth.name}
              </td>
              {MONTH_LABELS.map((_, monthIndex) => {
                const [start, end] = monthRange(year, monthIndex);
                const count = blocks.filter(
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
