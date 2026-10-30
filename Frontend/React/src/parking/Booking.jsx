import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const slot = location.state?.slot;

  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  if (!slot) {
    return (
      <main className="booking-page">
        <div className="booking-container">
          <section className="booking-card">
            <h2>No parking slot selected</h2>
            <p className="booking-muted">
              Please select a parking slot before booking.
            </p>
            <button
              type="button"
              className="booking-primary"
              onClick={() => navigate("/parking_slots")}
            >
              Back to Parking Slots
            </button>
          </section>
        </div>
      </main>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!bookingDate || !startTime || !endTime) {
      setMessage("Please fill in all booking details.");
      return;
    }

    if (bookingDate === minDate) {
      const selectedStart = new Date(`${bookingDate}T${startTime}`);

      if (selectedStart <= new Date()) {
        setMessage("Please select a future start time.");
        return;
      }
    }

    if (endTime <= startTime) {
      setMessage("End time must be after start time.");
      return;
    }

    setSubmitting(true);

    try {
      const csrfResponse = await fetch(
        "https://parking-pulse-full-project-1.onrender.com/api/csrf/"
        { credentials: "include" }
      );

      if (!csrfResponse.ok) {
        throw new Error("Could not initialize security token. Please try again.");
      }

      const csrfCookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith("csrftoken="));

      const csrfToken = csrfCookie
        ? decodeURIComponent(csrfCookie.split("=")[1])
        : "";

      if (!csrfToken) {
        throw new Error("Security token missing. Please log in again.");
      }

      const startDateTime = new Date(
        `${bookingDate}T${startTime}`
      ).toISOString();

      const endDateTime = new Date(
        `${bookingDate}T${endTime}`
      ).toISOString();

      const response = await fetch(
        "http://localhost:8000/api/booking/create/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            parking_slot: slot.id,
            start_time: startDateTime,
            end_time: endDateTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorText =
          typeof data.error === "string"
            ? data.error
            : Object.values(data).flat().join(" ");

        throw new Error(errorText || "Booking failed. Please try again.");
      }

      setBookingDetails(data);
      setMessage("Booking successful!");
    } catch (error) {
      console.error("Booking error:", error);
      setMessage(error.message || "Could not complete booking.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelBooking() {
    if (!bookingDetails?.id) {
      setMessage("Booking ID is missing. Cannot cancel this booking.");
      return;
    }

    setCancelling(true);
    setMessage("");

    try {
      const csrfResponse = await fetch(
        "http://localhost:8000/api/csrf/",
        { credentials: "include" }
      );

      if (!csrfResponse.ok) {
        throw new Error("Could not initialize security token.");
      }

      const csrfCookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith("csrftoken="));

      const csrfToken = csrfCookie
        ? decodeURIComponent(csrfCookie.split("=")[1])
        : "";

      if (!csrfToken) {
        throw new Error("Security token missing. Please log in again.");
      }

      const response = await fetch(
        `http://localhost:8000/api/booking/${bookingDetails.id}/cancel/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Booking cancellation failed.");
      }

      setBookingDetails(data.booking);
      setMessage("Booking cancelled successfully.");
    } catch (error) {
      console.error("Cancel booking error:", error);
      setMessage(error.message || "Could not cancel booking.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <main className="booking-page">
      <div className="booking-container">
        <header className="booking-hero">
          <p>PARKING PULSE · PARKING RESERVATION</p>
          <h1>Reserve your parking spot</h1>
          <p className="booking-subtitle">
            Choose your date and time, confirm your booking, and keep your
            parking details handy.
          </p>
        </header>

        <section className="booking-card">
          <h2>Booking Details</h2>
          <p className="booking-muted">
            Check your selected slot and enter your preferred parking time.
          </p>

          <div className="booking-slot-info">
            <div>
              <span className="booking-muted">Selected Parking Slot</span>
              <h3>{slot.slot_number}</h3>
              <span className="booking-muted">
                Vehicle type: {slot.vehicle_type}
              </span>
            </div>
            <span className="booking-slot-badge">Slot Selected</span>
          </div>

          {!bookingDetails && (
            <form className="booking-form" onSubmit={handleSubmit}>
              <label>
                Booking Date
                <input
                  type="date"
                  value={bookingDate}
                  min={minDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                />
              </label>

              <div className="booking-time-grid">
                <label>
                  Start Time
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </label>

                <label>
                  End Time
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="booking-actions">
                <button
                  type="submit"
                  className="booking-primary"
                  disabled={submitting}
                >
                  {submitting ? "Confirming..." : "Confirm Booking"}
                </button>

                <button
                  type="button"
                  className="booking-secondary"
                  onClick={() => navigate("/parking_slots")}
                >
                  Back to Parking Slots
                </button>
              </div>
            </form>
          )}

          {message && (
            <p
              className={
                message.toLowerCase().includes("success")
                  ? "booking-feedback"
                  : "booking-feedback booking-feedback-error"
              }
              role="status"
            >
              {message}
            </p>
          )}
        </section>

        {bookingDetails && (
          <section className="booking-card booking-confirmation">
            <div className="booking-success-heading">
              <div className="booking-success-icon">
                {bookingDetails.status === "Cancelled" ? "!" : "✓"}
              </div>
              <div>
                <h2>
                  {bookingDetails.status === "Cancelled"
                    ? "Booking Cancelled"
                    : "Booking Confirmation"}
                </h2>
                <p className="booking-muted">
                  {bookingDetails.status === "Cancelled"
                    ? "This reservation has been cancelled."
                    : "Your booking details are shown below."}
                </p>
              </div>
            </div>

            <div className="booking-detail-list">
              <div className="booking-detail-row">
                <span>Booking ID</span>
                <strong>#{bookingDetails.id}</strong>
              </div>
              <div className="booking-detail-row">
                <span>Parking Slot</span>
                <strong>{slot.slot_number}</strong>
              </div>
              <div className="booking-detail-row">
                <span>Vehicle Type</span>
                <strong>{slot.vehicle_type}</strong>
              </div>
              <div className="booking-detail-row">
                <span>Booking Date</span>
                <strong>{bookingDate}</strong>
              </div>
              <div className="booking-detail-row">
                <span>Start Time</span>
                <strong>{startTime}</strong>
              </div>
              <div className="booking-detail-row">
                <span>End Time</span>
                <strong>{endTime}</strong>
              </div>
              <div className="booking-detail-row">
                <span>Booking Status</span>
                <strong>
                  <span
                    className={`booking-status ${
                      bookingDetails.status === "Cancelled"
                        ? "booking-status-cancelled"
                        : bookingDetails.status === "Completed"
                        ? "booking-status-completed"
                        : ""
                    }`}
                  >
                    {bookingDetails.status}
                  </span>
                </strong>
              </div>
            </div>

            <div className="booking-actions">
              {bookingDetails.status !== "Cancelled" &&
                bookingDetails.status !== "Completed" && (
                  <button
                    type="button"
                    className="booking-danger"
                    onClick={handleCancelBooking}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling..." : "Cancel Booking"}
                  </button>
                )}

              <button
                type="button"
                className="booking-primary"
                onClick={() => navigate("/parking_slots")}
              >
                Back to Parking Slots
              </button>
            </div>

            {message && (
              <p
                className={
                  message.toLowerCase().includes("success")
                    ? "booking-feedback"
                    : "booking-feedback booking-feedback-error"
                }
                role="status"
              >
                {message}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
