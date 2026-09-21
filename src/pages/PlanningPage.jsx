import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useTrip } from "../contexts/TripContext";
import { capitalizeFirstLetter } from "../utils/capitalizeFirstLetter";
import { formatDateForDisplay, formatDateShort } from "../utils/formatDates";
import { computeDayLocations } from "../utils/dayLocations";
import ActivityForm from "../components/activity/ActivityForm";
import ActivityList from "../components/activity/ActivityList";
import Map from "../components/layout/Map";
import DayLocationEditor from "../components/layout/DayLocationEditor";
import { saveTrip } from "../utils/firestoreUtils";
import { useAuth } from "../contexts/AuthContext";
import "../styles/PlanningPage.css";
import "../styles/ActivityForm.css";

export default function PlanningPage() {
  const { state, dispatch } = useTrip();
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const { date } = useParams(); // get date from url parameter
  const navigate = useNavigate();

  // ******************************************************

  const activeDate = date || state.dates[0]?.toISOString() || null;

  // Memoized so Map's effect (which depends on the resolved center object)
  // doesn't re-run on every unrelated re-render, e.g. typing in ActivityForm.
  const dayLocationsByDate = useMemo(
    () =>
      computeDayLocations(
        state.dates,
        state.dayLocations,
        state.destination,
        state.mapCenter
      ),
    [state.dates, state.dayLocations, state.destination, state.mapCenter]
  );
  const activeLocation = activeDate
    ? dayLocationsByDate[activeDate]
    : { destination: state.destination, mapCenter: state.mapCenter };

  // Autosave to Firestore whenever the trip's plan changes, so activities
  // (and location changes) persist without requiring an explicit "Update
  // Trip" click. Debounced so rapid edits (e.g. typing) don't fire a write
  // per keystroke.
  useEffect(() => {
    if (!currentUser || !state.tripId) return;

    const timeoutId = setTimeout(() => {
      saveTrip(
        currentUser.uid,
        {
          destination: state.destination,
          dates: state.dates,
          activities: state.activities,
          totalDays: state.totalDays,
          mapCenter: state.mapCenter,
          dayLocations: state.dayLocations,
        },
        state.tripId
      ).catch((error) => console.error("Autosave failed:", error));
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [
    currentUser,
    state.tripId,
    state.activities,
    state.dayLocations,
    state.destination,
    state.dates,
    state.totalDays,
    state.mapCenter,
  ]);

  // If no valid date is selected, show the no-plan-message
  if (!activeDate) {
    return (
      <div className="planning-container">
        <div className="no-plan-message">
          <p>
            No valid date selected. <br /> Please start a new trip planning.
          </p>
          <Link to="/">
            <button>Start Planning</button>
          </Link>
        </div>
      </div>
    );
  }

  // ******************************************************

  const handleUpdateTrip = async () => {
    if (!currentUser) {
      alert("Please login to save your itinerary");
      // Store current trip data in localStorage before redirecting
      const guestTripData = {
        destination: state.destination,
        dates: state.dates,
        activities: state.activities,
        totalDays: state.totalDays,
        mapCenter: state.mapCenter,
        dayLocations: state.dayLocations,
      };
      localStorage.setItem("guestTripData", JSON.stringify(guestTripData));
      navigate("/login");
      return;
    }

    if (!state.tripId) return;

    try {
      setIsSaving(true);
      const tripData = {
        destination: state.destination,
        dates: state.dates,
        activities: state.activities,
        totalDays: state.totalDays,
        mapCenter: state.mapCenter,
        dayLocations: state.dayLocations,
      };

      await saveTrip(currentUser.uid, tripData, state.tripId);
      alert("Trip updated successfully!");
    } catch (error) {
      console.error("Error updating trip:", error);
      alert("Failed to update trip");
    } finally {
      setIsSaving(false);
    }
  };

  // ******************************************************
  // ******************************************************

  return (
    <div className="planning-container">
      <aside className="days-sidebar">
        <h2>Overview</h2>
        <h3>
          {state.totalDays ? `${state.totalDays} Days` : "No days selected"}
        </h3>
        <ul>
          {state.dates.map((day, index) => {
            const dayKey = day.toISOString();
            const location = dayLocationsByDate[dayKey];
            const previousDay = index > 0 ? state.dates[index - 1] : null;
            const isTransitionDay =
              previousDay &&
              dayLocationsByDate[previousDay.toISOString()].destination !==
                location.destination;

            return (
              <li
                key={day.toString()}
                className={[
                  activeDate === dayKey ? "selected" : "",
                  isTransitionDay ? "transition-day" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {isTransitionDay && (
                  <div className="transition-marker">
                    ✈ Now in {capitalizeFirstLetter(location.destination)}
                  </div>
                )}
                <Link
                  to={`/planning/${dayKey}`}
                  style={{ display: "block", width: "100%", height: "100%" }}
                >
                  {formatDateShort(day)}
                  <span className="day-list-location">
                    {capitalizeFirstLetter(location.destination)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {state.tripId && (
          <button
            onClick={handleUpdateTrip}
            disabled={isSaving}
            className="update-trip-button"
          >
            {isSaving ? "Updating..." : "Update Trip"}
          </button>
        )}
        <Link to={`/itinerary`}>
          <button className="manage-trip-button">See Trip Details</button>
        </Link>
        <Link to={`/`}>
          <button className="start-new-plan-button">Plan New Trip</button>
        </Link>
      </aside>

      <main className="activities-section">
        <h2>Trip to {capitalizeFirstLetter(state.destination)}</h2>
        {activeDate ? (
          <div className="selected-date-activities">
            <h3>
              Plans for {""}
              <span>{formatDateForDisplay(activeDate)}</span>
            </h3>
            <DayLocationEditor
              effectiveLocation={activeLocation}
              hasOverride={Boolean(state.dayLocations[activeDate])}
              onSetLocation={(destination, mapCenter) =>
                dispatch({
                  type: "SET_DAY_LOCATION",
                  payload: { date: activeDate, destination, mapCenter },
                })
              }
              onClearOverride={() =>
                dispatch({
                  type: "REMOVE_DAY_LOCATION",
                  payload: { date: activeDate },
                })
              }
            />
            <ActivityForm date={activeDate} />
            <ActivityList date={activeDate} />
          </div>
        ) : (
          <>
            <p>Select a place and dates to start planning.</p>
            <Link to="/">
              <button>Set place and dates</button>
            </Link>
          </>
        )}
      </main>

      <aside className="map-section">
        <Map center={activeLocation.mapCenter} />
      </aside>
    </div>
  );
}
