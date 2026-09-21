// Parses a "YYYY-MM-DD" date-only string (e.g. from a <input type="date">) as a
// local-timezone date instead of UTC midnight. `new Date("YYYY-MM-DD")` parses as
// UTC, which shifts the displayed date back a day in timezones behind UTC.
export function parseLocalDateString(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Formats a Date object as a local "YYYY-MM-DD" string suitable for
// <input type="date">. Avoids toISOString(), which converts to UTC and can
// shift the date by a day in timezones behind UTC.
export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

//  Formats a Date object to a short string format: Sun, Nov 10
export function formatDateShort(date) {
  if (!(date instanceof Date) || isNaN(date)) return "";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Formats an ISO date string to a long string format: Sunday, November 10
// ISO adheres to an international standard (ISO 8601) that sets the format for dates and times
export function formatDateLong(isoString) {
  const date = new Date(isoString);
  if (isNaN(date)) return "";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Formats a date input (Date object or ISO string) to a long string format: Sunday, November 10
// Use this function when the source of the date is unknown (string or object)
export function formatDateForDisplay(dateInput) {
  if (!dateInput) return "";
  
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date)) return "";
    
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

// Handles Firebase Timestamp conversion
export function convertFirebaseDate(date) {
  return date?.toDate ? date.toDate() : new Date(date);
}

// For saved trips display format: Nov 10, 2023
export function formatTripDate(dateString) {
  try {
    const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
    if (isNaN(date)) return "Invalid Date";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}
