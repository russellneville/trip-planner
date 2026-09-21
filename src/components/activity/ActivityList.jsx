import { useTrip } from "../../contexts/TripContext";
import ActivityCard from "./ActivityCard";
import { sortActivitiesByTime } from "../../utils/sortActivities";
import "../../styles/ActivityList.css";

export default function ActivityList({ date }) {
  const { state, dispatch } = useTrip();

  // Get activities for this date, earliest start time first (undated last)
  const activities = sortActivitiesByTime(state.activities[date] || []);

  // Calculate the starting index for this day's activities
  const getGlobalIndex = (localIndex) => {
    let totalPreviousActivities = 0;
    for (const [dateKey, dateActivities] of Object.entries(state.activities)) {
      if (dateKey === date) break;
      totalPreviousActivities += dateActivities.length;
    }
    return totalPreviousActivities + localIndex;
  };

  function handleRemoveActivity(activityId) {
    const activityCard = document.getElementById(activityId);
    if (activityCard) {
      activityCard.classList.add("removing");
      setTimeout(() => {
        dispatch({
          type: "REMOVE_ACTIVITY",
          payload: { dateToRemove: date, activityId },
        });
      }, 300);
    }
  }

  function handleEditActivity(activity, field, value) {
    const updatedActivity = { ...activity, [field]: value };
    dispatch({
      type: "EDIT_ACTIVITY",
      payload: {
        dateToUpdate: date,
        updatedActivity,
      },
    });
  }

  return (
    <div className="activity-list">
      {activities.map((activity, index) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          index={getGlobalIndex(index)}
          handleRemoveActivity={handleRemoveActivity}
          handleEditActivity={handleEditActivity}
        />
      ))}
    </div>
  );
}
