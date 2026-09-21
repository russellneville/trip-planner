import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTrip } from "../contexts/TripContext";
import { getUserTrips, deleteTrip } from "../utils/firestoreUtils";
import TripCard from "../components/activity/TripCard";
import { convertFirebaseDate } from "../utils/formatDates";
import "../styles/SavedTripsPage.css";

export default function SavedTripsPage() {
  const { currentUser, loading, dispatch } = useAuth();
  const { dispatch: tripDispatch } = useTrip();
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTrips() {
      try {
        const userTrips = await getUserTrips(currentUser.uid);
        setTrips(userTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }

    fetchTrips();
  }, [currentUser, dispatch]);

  // ******************************************************

  const handleViewTrip = (trip) => {
    const dates = trip.dates.map(convertFirebaseDate);

    tripDispatch({
      type: "SET_TRIP_DETAILS",
      payload: {
        destination: trip.destination,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        dates,
        totalDays: trip.totalDays,
        mapCenter: trip.mapCenter,
        tripId: trip.id,
        dayLocations: trip.dayLocations || {},
      },
    });

    tripDispatch({
      type: "SET_ACTIVITIES",
      payload: trip.activities,
    });

    navigate(`/planning/${dates[0].toISOString()}`);
  };

  // ******************************************************

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      try {
        await deleteTrip(currentUser.uid, tripId);
        setTrips(trips.filter((trip) => trip.id !== tripId));
      } catch (error) {
        console.error("Error deleting trip:", error);
        alert("Failed to delete trip");
      }
    }
  };

  // ******************************************************

  if (loading) return <div>Loading...</div>;

  return (
    <div className="saved-trips-container">
      <header className="dashboard-header">
        <h1>Your Saved Trips</h1>
      </header>

      <div className="trips-section">
        {trips.length === 0 ? (
          <div className="no-trips">
            <p>You haven't saved any trips yet.</p>
            <button
              onClick={() => {
                tripDispatch({ type: "RESET_STATE" });
                navigate("/");
              }}
              className="create-trip-btn"
            >
              Plan Your First Trip
            </button>
          </div>
        ) : (
          <div className="trips-grid">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onView={handleViewTrip}
                onDelete={handleDeleteTrip}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
