// Greedy interval-scheduling lane assignment, so overlapping bookings within
// the same berth row stack instead of hiding each other.
export function assignLanes<T extends { startDate: string; endDate: string }>(
  items: T[],
): { laneOf: number[]; laneCount: number } {
  const order = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.startDate.localeCompare(b.item.startDate));

  const laneEnds: string[] = [];
  const laneOf = new Array(items.length).fill(0);

  for (const { item, index } of order) {
    let placedLane = -1;
    for (let lane = 0; lane < laneEnds.length; lane++) {
      if (laneEnds[lane] < item.startDate) {
        placedLane = lane;
        break;
      }
    }
    if (placedLane === -1) {
      placedLane = laneEnds.length;
      laneEnds.push(item.endDate);
    } else {
      laneEnds[placedLane] = item.endDate;
    }
    laneOf[index] = placedLane;
  }

  return { laneOf, laneCount: Math.max(1, laneEnds.length) };
}
