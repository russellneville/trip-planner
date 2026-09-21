import { useState } from "react";
import { getCitySuggestions, getPlaceDetails } from "../../utils/hereMapUtils";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";
import "../../styles/DayLocationEditor.css";

// Lets the user set (or clear) a per-day location override for a trip that
// moves between places. `effectiveLocation` is the resolved destination for
// this day (see utils/dayLocations.js); `hasOverride` is true only when this
// specific day carries its own override (vs. inheriting a prior day's).
export default function DayLocationEditor({
  effectiveLocation,
  hasOverride,
  onSetLocation,
  onClearOverride,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  async function handleQueryChange(e) {
    const value = e.target.value;
    setQuery(value);
    if (value.length >= 2) {
      setSuggestions(await getCitySuggestions(value));
    } else {
      setSuggestions([]);
    }
  }

  async function handleSelect(suggestion) {
    const cityName = suggestion.title.split(",").pop().trim();
    const placeDetails = await getPlaceDetails(suggestion.id);
    if (placeDetails && placeDetails.position) {
      onSetLocation(cityName, {
        lat: placeDetails.position.lat,
        lng: placeDetails.position.lng,
      });
    }
    setIsEditing(false);
    setQuery("");
    setSuggestions([]);
  }

  if (!isEditing) {
    return (
      <div className="day-location">
        <span className="day-location-label">
          {capitalizeFirstLetter(effectiveLocation.destination)}
        </span>
        <button
          type="button"
          className="day-location-edit-btn"
          onClick={() => setIsEditing(true)}
        >
          Change
        </button>
        {hasOverride && (
          <button
            type="button"
            className="day-location-reset-btn"
            onClick={onClearOverride}
          >
            Reset
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="day-location day-location-editing">
      <input
        type="text"
        autoFocus
        value={query}
        onChange={handleQueryChange}
        placeholder="New location for this day onward"
      />
      {suggestions.length > 0 && (
        <ul className="day-location-suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} onClick={() => handleSelect(suggestion)}>
              {suggestion.title}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="day-location-edit-btn"
        onClick={() => {
          setIsEditing(false);
          setQuery("");
          setSuggestions([]);
        }}
      >
        Cancel
      </button>
    </div>
  );
}
