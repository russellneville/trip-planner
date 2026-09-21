import html2pdf from "html2pdf.js";

export async function exportToPdf(destination, dates, activities) {
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

  // Get first and last date
  const startDate = dates[0].toLocaleDateString();
  const endDate = dates[dates.length - 1].toLocaleDateString();

  // Get current date for the PDF generation
  const generatedDate = new Date().toLocaleDateString();

  // Create a new div for PDF content
  const pdfContent = document.createElement("div");

  pdfContent.innerHTML = `
    <div style="padding: 20px; font-family: Arial;">
      <!-- Header Section -->
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #4CAF50;">
        <h1 style="color: #136850; margin: 0;">Trip Planner</h1>
        <p style="color: #136850; font-size: 18px;">Your Personal Travel Itinerary</p>
        <p style="color: #666; font-size: 14px;">Generated on ${generatedDate}</p>
      </div>

      <!-- Trip Details Section -->
      <div style="background-color: #e7f0ee; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #333; margin-top: 0;">Trip to ${destination.charAt(0).toUpperCase() + destination.slice(1).toLowerCase()}</h2>
        <div style="margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${dates.length} Days</p>
          <p style="margin: 5px 0;"><strong>Total Budget:</strong> $${totalBudget}</p>
        </div>
      </div>

      ${dates
        .map((date, index) => {
          const dayActivities = activities[date.toISOString()] || [];

          const dayBudget = dayActivities.reduce(
            (total, activity) => total + (Number(activity.price) || 0),
            0
          );

          return `
          <div style="margin: 20px 0; padding: 15px; border: 1px solid #ccc;">
            <h2>Day ${index + 1} - ${date.toLocaleDateString()}</h2>
            <p>${dayActivities.length} Activities | $${dayBudget} Total</p>
            ${dayActivities
              .map(
                (activity) => `
              <div style="margin: 10px 0;">
                <span>${activity.startTime || "No start time"} - ${
                  activity.endTime || "No end time"
                }</span>
                <span>| ${activity.title}</span>
                <span>| $${activity.price || 0}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `;
        })
        .join("")}
    </div>
  `;

  // PDF options
  const options = {
    margin: 1,
    filename: `${destination}_trip_plan.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  // Generate PDF
  try {
    await html2pdf().from(pdfContent).set(options).save();
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}

export function shareItinerary(destination, dates, activities) {
  // Create sharable data
  const shareData = {
    title: `Trip to ${destination}`,
    text: `Check out my trip plan to to ${destination}!`,
    url: window.location.href,
  };

  // Use Web Share API if available
  if (navigator.share) {
    navigator
      .share(shareData)
      .catch((error) => console.error("Error sharing", error));
  } else {
    // Fallback: Copy URL to clipboard
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => alert("Itinerary link copied to clipboard!"))
      .catch((error) => console.error("Error copying to clipboard:", error));
  }
}
