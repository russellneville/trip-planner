import { formatTripDate, convertFirebaseDate } from "../../utils/formatDates";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";

export default function TripCard({ trip, onView, onDelete }) {
  const calculateTripStats = (trip) => {
    let totalActivities = 0;
    let totalBudget = 0;

    Object.values(trip.activities).forEach((dayActivities) => {
      totalActivities += dayActivities.length;
      dayActivities.forEach((activity) => {
        totalBudget += Number(activity.price) || 0;
      });
    });

    return { totalActivities, totalBudget };
  };

  const { totalActivities, totalBudget } = calculateTripStats(trip);
  const firstDate = convertFirebaseDate(trip.dates[0]);
  const lastDate = convertFirebaseDate(trip.dates[trip.dates.length - 1]);

  return (
    <div className="trip-card">
      <div className="trip-card-header">
        <h3>{capitalizeFirstLetter(trip.destination)}</h3>
        <span className="trip-dates">
          {formatTripDate(firstDate)} - {formatTripDate(lastDate)}
        </span>
      </div>

      <div className="trip-card-content">
        <div className="trip-stats">
          <div className="stat">
            <span className="stat-label">Days</span>
            <span className="stat-value">{trip.totalDays}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Activities</span>
            <span className="stat-value">{totalActivities}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Budget</span>
            <span className="stat-value">${totalBudget}</span>
          </div>
        </div>

        <div className="trip-preview">
          {Object.entries(trip.activities)
            .slice(0, 2)
            .map(([date, activities]) => (
              <div key={date} className="day-preview">
                <p className="day-date">{formatTripDate(date)}</p>
                {activities.slice(0, 2).map((activity, index) => (
                  <div key={index} className="activity-preview">
                    <span>{activity.startTime}-&nbsp;</span>
                    <span>{activity.title}</span>
                  </div>
                ))}
                {activities.length > 2 && (
                  <p className="more-activities">
                    +{activities.length - 2} more activities
                  </p>
                )}
              </div>
            ))}
        </div>
      </div>

      <div className="trip-card-actions">
        <button onClick={() => onView(trip)} className="view-trip-btn">
          View Trip
        </button>
        <button onClick={() => onDelete(trip.id)} className="delete-trip-btn">
          Delete
        </button>
      </div>
    </div>
  );
} 