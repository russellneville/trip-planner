import { act } from "react";
import { computeTripDateRange } from "../utils/formatDates";

export const initialState = {
  destination: "",
  destinationInput: "",
  activityInput: "",
  activitySuggestions: [],
  startDate: "",
  endDate: "",
  totalDays: 0,
  dates: [],
  selectedDate: null,
  activities: {},
  suggestions: [],
  mapCenter: null,
  // Sparse map of ISO date string -> { destination, mapCenter } override for
  // trips that move between places. Days without an entry inherit the most
  // recent prior override (see utils/dayLocations.js).
  dayLocations: {},
  isLoading: false,
  error: null,
  tripId: null,
};

export default function tripReducer(state, action) {
  switch (action.type) {
    case "RESET_STATE": {
      return {
        ...initialState,
      };
    }
    case "SET_DESTINATION_INPUT": {
      const { destinationInput } = action.payload;
      return {
        ...state,
        destinationInput,
      };
    }
    case "SET_SUGGESTIONS": {
      const { suggestions } = action.payload;
      return {
        ...state,
        suggestions,
      };
    }
    case "SET_MAP_CENTER": {
      const { center } = action.payload;
      return {
        ...state,
        mapCenter: center,
      };
    }
    case "SET_TRIP_DETAILS": {
      const { destination, startDate, endDate, mapCenter, tripId, dayLocations } =
        action.payload;
      const { dates, totalDays } = computeTripDateRange(startDate, endDate);
      return {
        ...state,
        destination,
        dates,
        totalDays,
        startDate,
        endDate,
        mapCenter: mapCenter || state.mapCenter,
        tripId: tripId || state.tripId,
        dayLocations: dayLocations || state.dayLocations,
      };
    }
    case "SET_DAY_LOCATION": {
      const { date, destination, mapCenter } = action.payload;
      return {
        ...state,
        dayLocations: {
          ...state.dayLocations,
          [date]: { destination, mapCenter },
        },
      };
    }
    case "REMOVE_DAY_LOCATION": {
      const { date } = action.payload;
      const dayLocations = { ...state.dayLocations };
      delete dayLocations[date];
      return { ...state, dayLocations };
    }
    case "SET_ACTIVITY_INPUT": {
      const { activityInput } = action.payload;
      return {
        ...state,
        activityInput,
      };
    }
    case "SET_ACTIVITY_SUGGESTIONS": {
      const { suggestions } = action.payload;
      return {
        ...state,
        activitySuggestions: suggestions,
      };
    }
    case "ADD_ACTIVITY": {
      const { date, activity } = action.payload; // Here, date refers to the date from the ActivityForm
      return {
        ...state,
        activities: {
          ...state.activities, // Copy and preserve the existing activities object
          [date]: [
            ...(state.activities[date] || []), // Get existing activities for the date or an empty array if none exist
            { ...activity, id: Date.now() }, // Add the new activity with a unique ID (activity.id)
          ],
        },
      };
    }
    case "REMOVE_ACTIVITY": {
      const { dateToRemove, activityId } = action.payload;
      return {
        ...state,
        activities: {
          ...state.activities,
          [dateToRemove]: state.activities[dateToRemove].filter(
            (act) => act.id !== activityId
          ),
        },
      };
    }
    case "EDIT_ACTIVITY": {
      const { dateToUpdate, updatedActivity } = action.payload;
      return {
        ...state,
        activities: {
          ...state.activities,
          [dateToUpdate]: state.activities[dateToUpdate].map((act) =>
            act.id === updatedActivity.id ? updatedActivity : act
          ),
        },
      };
    }
    case "SET_ACTIVITIES": {
      return {
        ...state,
        activities: action.payload,
      };
    }
    default:
      return state;
  }
}
