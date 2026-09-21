// Resolves the effective { destination, mapCenter } for every day of a trip.
// `dayLocations` is a sparse map (ISO date string -> override) set only on
// days where the trip moves to a new place; days without an entry inherit
// the most recent prior override, or the trip's original destination for
// days before the first override.
export function computeDayLocations(
  dates,
  dayLocations,
  defaultDestination,
  defaultMapCenter
) {
  let current = { destination: defaultDestination, mapCenter: defaultMapCenter };
  const byDate = {};

  dates.forEach((day) => {
    const key = day.toISOString();
    if (dayLocations && dayLocations[key]) {
      current = dayLocations[key];
    }
    byDate[key] = current;
  });

  return byDate;
}
