import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTrip } from "../contexts/TripContext";
import { useAuth } from "../contexts/AuthContext";
import { saveTrip } from "../utils/firestoreUtils";
import { formatDateForDisplay } from "../utils/formatDates";
import { exportToPdf } from "../utils/exportUtils";
import "../styles/ItineraryPage.css";

function ItineraryPage() {
  const { state } = useTrip();
  const { destination, dates, activities, totalDays } = state;
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // ******************************************************

  // Check if there's a valid plan
  const hasPlan =
    destination && dates.length > 0 && Object.keys(activities).length > 0;

  // If no plan exists, show the same message as PlanningPage
  if (!hasPlan) {
    return (
      <div className="itinerary-page">
        <div className="itinerary-container">
          <div className="no-plan-message">
            <p>
              No valid trip plan found. <br /> Please start a new trip planning.
            </p>
            <Link to="/">
              <button>Start Planning</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ******************************************************

  // Handle save trip
  const handleSave = async () => {
    if (!currentUser) {
      alert("Please login to save your itinerary");
      // Store current trip data in localStorage before redirecting
      const guestTripData = {
        destination,
        dates,
        activities,
        totalDays,
        mapCenter: state.mapCenter,
        markers: state.markers,
      };
      localStorage.setItem("guestTripData", JSON.stringify(guestTripData));
      navigate("/login");
      return;
    }

    try {
      setIsSaving(true);
      const tripData = {
        destination,
        dates,
        activities,
        totalDays,
        totalBudget,
        mapCenter: state.mapCenter,
        markers: state.markers,
      };

      // If tripId exists, update the existing trip
      await saveTrip(currentUser.uid, tripData, state.tripId);
      alert("Trip saved successfully!");
    } catch (error) {
      console.error("Error saving trip:", error);
      alert("Failed to save trip");
    } finally {
      setIsSaving(false);
    }
  };

  // ******************************************************

  // Auto-save for guests (local storage)
  useEffect(() => {
    if (!currentUser && hasPlan) {
      localStorage.setItem(
        "guestTripData",
        JSON.stringify({
          destination,
          dates,
          activities,
          totalDays,
        })
      );
    }
  }, [destination, dates, activities, totalDays, currentUser]);

  // ******************************************************

  // Calculate total budget
  const totalBudget = Object.values(activities).reduce(
    (total, dayActivities) => {
      return (
        total +
        dayActivities.reduce((dayTotal, activity) => {
          return dayTotal + (Number(activity.price) || 0);
        }, 0)
      );
    },
    0
  );

  // ******************************************************

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!hasPlan) {
      alert("Please create a plan before exporting");
      return;
    }

    if (!currentUser) {
      alert("Please login to export your itinerary to PDF");
      return;
    }

    const success = await exportToPdf(destination, dates, activities);
    if (success) {
      alert("PDF exported successfully!");
    } else {
      alert("Failed to export PDF. Please try again.");
    }
  };

  // ******************************************************

  // Helper function to determine button text
  const getSaveButtonText = () => {
    if (isSaving) return "Saving...";
    if (state.tripId) return "Update Trip";
    return "Save Trip";
  };

  // Helper function to determine density level
  const getDensityLevel = (activityCount) => {
    if (activityCount <= 2) return "low";
    if (activityCount <= 4) return "medium";
    return "high";
  };

  // ******************************************************
  // ******************************************************

  return (
    <div className="itinerary-page">
      <div id="itinerary-content">
        <div className="itinerary-container">
          <header className="itinerary-header">
            <h1>
              Your Trip to{" "}
              {destination.charAt(0).toUpperCase() +
                destination.slice(1).toLowerCase()}
            </h1>
            <div className="trip-overview">
              <p>{totalDays} Days</p>
              <p>Total Budget: ${totalBudget}</p>
            </div>
            <div className="action-buttons">
              <button
                onClick={handleExportPDF}
                className={!currentUser ? "btn-disabled" : ""}
                title={!currentUser ? "Login to export PDF" : "Export to PDF"}
              >
                Export PDF
              </button>
              <button
                onClick={() => {
                  if (!currentUser) {
                    alert("Please login to share your itinerary");
                    return;
                  }
                  if (!hasPlan) {
                    alert("Please create a plan before sharing");
                    return;
                  }
                  // No need to set isShareModalOpen to true here
                }}
                className={!currentUser ? "btn-disabled" : ""}
                title={!currentUser ? "Login to share" : "Share itinerary"}
              >
                Share
              </button>
              <button
                onClick={() => {
                  if (!currentUser) {
                    alert("Please login to save your itinerary");
                    const guestTripData = {
                      destination,
                      dates,
                      activities,
                      totalDays,
                      mapCenter: state.mapCenter,
                      markers: state.markers,
                    };
                    localStorage.setItem(
                      "guestTripData",
                      JSON.stringify(guestTripData)
                    );
                    navigate("/login");
                    return;
                  }
                  handleSave();
                }}
                className={!currentUser ? "btn-disabled" : ""}
                title={
                  !currentUser
                    ? "Login to save"
                    : state.tripId
                    ? "Update trip"
                    : "Save trip"
                }
              >
                {getSaveButtonText()}
              </button>
              <Link to={destination && dates.length > 0 ? "/planning" : "/"}>
                <button>Back to Planning</button>
              </Link>
            </div>
          </header>

          <div className="summary-cards-grid">
            {dates.map((date, index) => {
              const dayActivities = activities[date.toISOString()] || [];
              const dayBudget = dayActivities.reduce(
                (total, activity) => total + (Number(activity.price) || 0),
                0
              );

              return (
                <div key={date.toString()} className="day-card">
                  <div className="day-header">
                    <h2>Day {index + 1} </h2>
                    <h2>{formatDateForDisplay(date)}</h2>
                    <div className="day-header-info">
                      <p>
                        {dayActivities.length} Activities | ${dayBudget} Total
                      </p>
                      <div
                        className={`density-indicator density-${getDensityLevel(
                          dayActivities.length
                        )}`}
                      >
                        <span>●</span>
                        <span>●</span>
                        <span>●</span>
                      </div>
                    </div>
                  </div>
                  <div className="activities-list">
                    {dayActivities.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <span className="activity-time">
                          {activity.startTime}
                        </span>
                        <span className="activity-title">{activity.title}</span>
                        <span className="activity-price">
                          ${activity.price || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {/* No need to render ShareModal here */}
        </div>
      </div>
    </div>
  );
}

export default ItineraryPage;
