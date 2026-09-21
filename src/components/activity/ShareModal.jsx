import { useTrip } from "../../contexts/TripContext";
import "../../styles/ShareModal.css";

export default function ShareModal({ onClose }) {
  const { state } = useTrip();

  const handleCopyToClipboard = async () => {
    try {
      const tripText = document.querySelector(".trip-preview").innerText;
      await navigator.clipboard.writeText(tripText);
      alert("Trip plan copied to clipboard!");
      onClose();
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      alert("Failed to copy. Please try again.");
    }
  };

  // ******************************************************
  // ******************************************************

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>

        <h2>Share Trip Plan</h2>

        <div className="share-options">
          <button onClick={handleCopyToClipboard}>Copy to Clipboard</button>
        </div>

        <div className="trip-preview">
          <h3>
            Trip to{" "}
            {state.destination.charAt(0).toUpperCase() +
              state.destination.slice(1).toLowerCase()}
          </h3>
          <p className="trip-dates">
            From{" "}
            {state.dates.length > 1
              ? `${state.dates[0].toLocaleDateString()} to ${state.dates[
                  state.dates.length - 1
                ].toLocaleDateString()}`
              : state.dates[0].toLocaleDateString()}
          </p>
          {state.dates.map((date, index) => {
            const dayActivities = state.activities[date.toISOString()] || [];
            return (
              <div key={date.toString()} className="day-preview">
                <h4>
                  Day {index + 1} - {date.toLocaleDateString()}
                </h4>
                {dayActivities.map((activity, actIndex) => (
                  <div key={actIndex} className="activity-preview">
                    {activity.startTime} - {activity.title} ($
                    {activity.price || 0})
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
