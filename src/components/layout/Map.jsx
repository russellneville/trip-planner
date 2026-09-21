import { useEffect, useRef } from "react";
import { useTrip } from "../../contexts/TripContext";
import { defaultLayers } from "../../utils/hereMapUtils";
import { sortActivitiesByTime } from "../../utils/sortActivities";
import "../../styles/Map.css";

export default function Map({ center }) {
  const { state } = useTrip();
  const mapRef = useRef(null);
  const map = useRef(null);
  // Falls back to the trip-level center when no per-day center is given.
  const activeCenter = center || state.mapCenter;

  useEffect(() => {
    if (!mapRef.current || !window.H) return;

    if (!map.current) {
      map.current = new window.H.Map(
        mapRef.current,
        defaultLayers.vector.normal.map,
        {
          zoom: activeCenter?.zoom || 12,
          center: {
            lat: activeCenter?.lat || 52.52,
            lng: activeCenter?.lng || 13.405,
          },
        }
      );

      new window.H.mapevents.Behavior(
        new window.H.mapevents.MapEvents(map.current)
      );

      window.H.ui.UI.createDefault(map.current, defaultLayers);
    } else {
      map.current.setCenter({
        lat: activeCenter?.lat || 52.52,
        lng: activeCenter?.lng || 13.405,
      });
      map.current.setZoom(activeCenter?.zoom || 12);
    }

    // Clear existing markers
    map.current.removeObjects(map.current.getObjects());

    // Add markers for activities that have a geo position, numbered to match
    // each activity's position number on its day's activity list (the same
    // sorted, flattened order ActivityList.jsx uses to number its cards).
    const allActivities = Object.values(state.activities).flatMap(
      sortActivitiesByTime
    );
    allActivities.forEach((activity, index) => {
      if (!activity.marker) return;

      const markerElement = document.createElement("div");
      markerElement.className = "numbered-marker";
      markerElement.innerHTML = `<span>${index + 1}</span>`;

      const icon = new window.H.map.DomIcon(markerElement);
      const markerObject = new window.H.map.DomMarker(
        {
          lat: activity.marker.lat,
          lng: activity.marker.lng,
        },
        { icon }
      );

      map.current.addObject(markerObject);
    });
  }, [activeCenter, state.activities]);

  // ******************************************************
  // ******************************************************

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        background: "#eee",
      }}
    />
  );
}
