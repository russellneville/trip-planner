import { BsTrash } from "react-icons/bs";

export default function ActivityCard({
  activity,
  index,
  handleRemoveActivity,
  handleEditActivity,
}) {
  function handleKeyDown(e, activity, field) {
    if (e.key === "Enter") {
      e.target.blur(); // Triggers the blur event which saves the change
    }
  }

  return (
    <div key={activity.id} className="activity-card-container">
      <div id={activity.id} className="activity-card">
        {/* Show number for all activities */}
        <div className="activity-number">{index + 1}</div>

        <input
          value={activity.title || ""}
          onChange={(e) =>
            handleEditActivity(activity, "title", e.target.value)
          }
          onBlur={(e) => handleEditActivity(activity, "title", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, activity, "title")}
          placeholder="Plan title"
        />
        <div className="time-inputs">
          <input
            type="time"
            value={activity.startTime || ""}
            onChange={(e) =>
              handleEditActivity(activity, "startTime", e.target.value)
            }
            onBlur={(e) =>
              handleEditActivity(activity, "startTime", e.target.value)
            }
            onKeyDown={(e) => handleKeyDown(e, activity, "startTime")}
            placeholder="Start time"
          />
          <input
            type="time"
            value={activity.endTime || ""}
            onChange={(e) =>
              handleEditActivity(activity, "endTime", e.target.value)
            }
            onBlur={(e) =>
              handleEditActivity(activity, "endTime", e.target.value)
            }
            onKeyDown={(e) => handleKeyDown(e, activity, "endTime")}
            placeholder="End time"
          />
        </div>
        <input
          value={activity.description || ""}
          onChange={(e) =>
            handleEditActivity(activity, "description", e.target.value)
          }
          onBlur={(e) =>
            handleEditActivity(activity, "description", e.target.value)
          }
          onKeyDown={(e) => handleKeyDown(e, activity, "description")}
          placeholder="Description"
        />
        <div className="price-container">
          <span className="price-symbol">$</span>
          <input
            type="number"
            value={activity.price || ""}
            onChange={(e) =>
              handleEditActivity(activity, "price", e.target.value)
            }
            onBlur={(e) =>
              handleEditActivity(activity, "price", e.target.value)
            }
            onKeyDown={(e) => handleKeyDown(e, activity, "price")}
            placeholder="Price"
          />
        </div>
      </div>

      <div className="activity-card-icons">
        <BsTrash
          onClick={() => handleRemoveActivity(activity.id)}
          style={{ color: "var(--dark-orange-color)" }}
          className="remove-activity-icon"
        />
      </div>
    </div>
  );
}
