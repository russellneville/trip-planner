import { useEffect, useRef } from "react";
import { useTrip } from "../../contexts/TripContext";
import {
  getAutocompleteSuggestions,
  getPlaceDetails,
} from "../../utils/hereMapUtils";
import "../../styles/ActivityForm.css";

export default function ActivityForm({ date }) {
  // {date} passed as props from PlanningPage.jsx (<ActivityForm date={activeDate} />)

  const { state, dispatch } = useTrip();
  const suggestionsRef = useRef(null);

  // ******************************************************

  const handleTitleChange = async (e) => {
    const query = e.target.value;
    dispatch({ type: "SET_ACTIVITY_INPUT", payload: { activityInput: query } });

    if (query.length >= 2) {
      const suggestions = await getAutocompleteSuggestions(
        query,
        state.mapCenter
      );
      dispatch({ type: "SET_ACTIVITY_SUGGESTIONS", payload: { suggestions } });
    } else {
      dispatch({
        type: "SET_ACTIVITY_SUGGESTIONS",
        payload: { suggestions: [] },
      });
    }
  };

  // ******************************************************

  const handleSuggestionSelect = async (suggestion) => {

    // Update input field
    dispatch({
      type: "SET_ACTIVITY_INPUT",
      payload: { activityInput: suggestion.title },
    });

    // Clear suggestions
    dispatch({
      type: "SET_ACTIVITY_SUGGESTIONS",
      payload: { suggestions: [] },
    });

    // Get place details and add marker
    const placeDetails = await getPlaceDetails(suggestion.id);

    if (placeDetails && placeDetails.position) {
      const marker = {
        lat: placeDetails.position.lat,
        lng: placeDetails.position.lng,
        title: suggestion.title,
      };
      dispatch({ type: "ADD_MARKER", payload: { marker } });
    }
  };

  // ******************************************************

  async function handleActivityFormSubmit(e) {
    e.preventDefault();

    // Check if we have a date
    if (!date) {
      console.error("No date selected");
      return;
    }

    const title = state.activityInput || e.target.title.value;
    const description = e.target.description.value;
    const startTime = e.target.startTime.value;
    const endTime = e.target.endTime.value;
    const price = e.target.price.value;

    // create activity object
    const activity = {
      title,
      description,
      startTime,
      endTime,
      price: Number(price),
    };

    dispatch({
      type: "ADD_ACTIVITY",
      payload: {
        date,
        activity,
      },
    });

    // clear form
    e.target.reset();
    dispatch({ type: "SET_ACTIVITY_INPUT", payload: { activityInput: "" } });
  }

  // ******************************************************

  // Handle clicks outside the suggestions list
  const handleClickOutside = (event) => {
    if (
      suggestionsRef.current &&
      !suggestionsRef.current.contains(event.target)
    ) {
      dispatch({
        type: "SET_ACTIVITY_SUGGESTIONS",
        payload: { suggestions: [] },
      });
    }
  };

  // ******************************************************

  // Handle Esc key press
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      dispatch({
        type: "SET_ACTIVITY_SUGGESTIONS",
        payload: { suggestions: [] },
      });
    }
  };

  // ******************************************************

  useEffect(() => {
    // Add event listeners
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ******************************************************
  // ******************************************************

  return (
    <form onSubmit={handleActivityFormSubmit} className="activity-form">
      <div className="activity-input-container">
        <input
          type="text"
          name="title"
          id="title"
          placeholder="Activity (e.g. Museum, Restaurant, Park)"
          onChange={handleTitleChange}
          value={state.activityInput || ""}
          required
        />
        {state.activitySuggestions && state.activitySuggestions.length > 0 && (
          <ul className="suggestions-list" ref={suggestionsRef}>
            {state.activitySuggestions.map((suggestion) => (
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

      <input
        type="text"
        name="description"
        id="description"
        placeholder="Description (e.g. 1000 years old, 100m away from the center)"
      />

      <div className="activity-form-time-price">
        <div className="start-time">
          <p>Start time</p>
          <input
            type="time"
            name="startTime"
            id="startTime"
            placeholder="Add time"
          />
        </div>
        <div className="end-time">
          <p>End time</p>
          <input
            type="time"
            name="endTime"
            id="endTime"
            placeholder="Add time"
          />
        </div>
        <input
          type="number"
          name="price"
          id="price"
          placeholder="Add cost per person"
        />
      </div>

      <button type="submit">Add Plan</button>
    </form>
  );
}
