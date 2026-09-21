// Sorts activities by start time, earliest first. Activities without a start
// time are pushed to the end, in their original relative order. Used by both
// ActivityList (card order/numbering) and Map (marker numbering) so the two
// stay in sync.
export function sortActivitiesByTime(activities) {
  return [...activities].sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });
}
