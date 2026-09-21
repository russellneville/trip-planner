import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "../contexts/TripContext";
import { useAuth } from "../contexts/AuthContext";
import {
  getAutocompleteSuggestions,
  getCitySuggestions,
  getPlaceDetails,
} from "../utils/hereMapUtils";
import {
  parseLocalDateString,
  toDateInputValue,
  computeTripDateRange,
} from "../utils/formatDates";
import { saveTrip } from "../utils/firestoreUtils";
import "../styles/HomePage.css";

export default function HomePage() {
  const { state, dispatch } = useTrip(); // useTrip is defined in TripContext.jsx (includes error handling)
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const suggestionsRef = useRef(null);
  const endDateRef = useRef(null);

  useEffect(() => {
    dispatch({ type: "RESET_STATE" });
  }, [dispatch]);

  // ******************************************************

  const handleDestinationChange = async (e) => {
    const query = e.target.value;
    dispatch({
      type: "SET_DESTINATION_INPUT",
      payload: { destinationInput: query },
    });
    if (query.length >= 2) {
      const suggestions = await getCitySuggestions(query);
      dispatch({
        type: "SET_SUGGESTIONS",
        payload: { suggestions },
      });
    } else {
      dispatch({
        type: "SET_SUGGESTIONS",
        payload: { suggestions: [] },
      });
    }
  };

  // ******************************************************

  const handleSuggestionSelect = async (suggestion) => {
    // Extract only the city name from the suggestion
    const cityName = suggestion.title.split(",").pop().trim();
    // Update input field with selected suggestion
    dispatch({
      type: "SET_DESTINATION_INPUT",
      payload: { destinationInput: cityName },
    });
    // Clear suggestions
    dispatch({
      type: "SET_SUGGESTIONS",
      payload: { suggestions: [] },
    });
    const placeDetails = await getPlaceDetails(suggestion.id);
    if (placeDetails && placeDetails.position) {
      dispatch({
        type: "SET_MAP_CENTER",
        payload: {
          center: {
            lat: placeDetails.position.lat,
            lng: placeDetails.position.lng,
          },
        },
      });
    }
  };

  // ******************************************************

  const handleStartDateChange = (e) => {
    const startValue = e.target.value;
    const endInput = endDateRef.current;
    if (!startValue || !endInput) return;

    // Only auto-advance the end date if it's empty or no longer after the
    // new start date, so we don't clobber an end date the user already chose.
    if (endInput.value && endInput.value > startValue) return;

    const nextDay = parseLocalDateString(startValue);
    nextDay.setDate(nextDay.getDate() + 1);
    endInput.value = toDateInputValue(nextDay);
  };

  // ******************************************************

  const handleHomePageSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      destination: state.destinationInput,
      startDate: e.target.startDate.value,
      endDate: e.target.endDate.value,
      mapCenter: state.mapCenter,
    };

    // Only geocode here if the user typed a destination without picking one
    // of the suggestions (which already sets state.mapCenter precisely).
    // Re-geocoding unconditionally overwrote the correct suggestion-based
    // center with an unrelated nearby match, since this lookup wasn't
    // biased toward the destination and defaulted to searching near Berlin.
    if (!formData.mapCenter) {
      const suggestions = await getAutocompleteSuggestions(
        formData.destination
      );
      if (suggestions.length > 0) {
        const placeDetails = await getPlaceDetails(suggestions[0].id);
        if (placeDetails && placeDetails.position) {
          formData.mapCenter = {
            lat: placeDetails.position.lat,
            lng: placeDetails.position.lng,
          };
        }
      }
    }

    // Save the trip immediately so it shows up under "My Trips" right away,
    // rather than only once the user later visits Itinerary and clicks Save.
    if (currentUser) {
      try {
        const { dates, totalDays } = computeTripDateRange(
          formData.startDate,
          formData.endDate
        );
        const tripId = await saveTrip(currentUser.uid, {
          destination: formData.destination,
          dates,
          totalDays,
          activities: {},
          mapCenter: formData.mapCenter,
          dayLocations: {},
        });
        formData.tripId = tripId;
      } catch (error) {
        console.error("Error saving trip:", error);
      }
    }

    dispatch({
      type: "SET_TRIP_DETAILS",
      payload: formData,
    });
    navigate("/planning");
  };

  // ******************************************************

  const handleClickOutside = (event) => {
    if (
      suggestionsRef.current &&
      !suggestionsRef.current.contains(event.target)
    ) {
      dispatch({
        type: "SET_SUGGESTIONS",
        payload: { suggestions: [] },
      });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      dispatch({
        type: "SET_SUGGESTIONS",
        payload: { suggestions: [] },
      });
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ******************************************************
  // ******************************************************

  return (
    <>
      <h1>Plan your trip</h1>
      <form onSubmit={handleHomePageSubmit}>
        <div className="destination-input-container">
          <h3>Where to?</h3>

          <input
            type="text"
            name="destination"
            placeholder="e.g. Paris, Hawaii, Japan"
            onChange={handleDestinationChange}
            value={state.destinationInput || ""}
            required
          />
          {state.suggestions && state.suggestions.length > 0 && (
            <ul className="suggestions-list" ref={suggestionsRef}>
              {state.suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  {suggestion.title}
                </li>
              ))}
            </ul>
          )}
        </div>
        <h3>When?</h3>
        <div className="input-dates-container">
          <div>
            <p>Start date</p>
            <input
              type="date"
              name="startDate"
              placeholder="Start date"
              onChange={handleStartDateChange}
              required
            />
          </div>
          <div>
            <p>End date</p>
            <input
              type="date"
              name="endDate"
              placeholder="End date"
              ref={endDateRef}
              required
            />
          </div>
        </div>
        <button type="submit">Plan trip</button>
      </form>
    </>
  );
}
