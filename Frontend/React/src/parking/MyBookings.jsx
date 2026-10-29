
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import carImage from "../assets/car.png";
import bikeImage from "../assets/bike.png";


const API = "http://localhost:8000/api";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/my-bookings/`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || data.error || "Unable to load bookings."
          );
        }

        return data;
      })
      .then((data) => setBookings(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function formatDateTime(value) {
    if (!value) return "Not available";

    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }


  
async function handleCancel(bookingId) {
  const confirmed = window.confirm(
    "Are you sure you want to cancel this booking?"
  );

  if (!confirmed) return;

  try {
    // Get the CSRF token
    const csrfResponse = await fetch(`${API}/csrf/`, {
      method: "GET",
      credentials: "include",
    });

    if (!csrfResponse.ok) {
      throw new Error("Unable to get CSRF token. Please log in again.");
    }

    const csrfData = await csrfResponse.json();

    const csrfToken =
      csrfData.csrfToken ||
      csrfData.csrf_token ||
      csrfData.token;

    if (!csrfToken) {
      throw new Error("CSRF token not found in the response.");
    }

    // Cancel the booking
    const response = await fetch(
      `${API}/booking/${bookingId}/cancel/`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-CSRFToken": csrfToken,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.detail || "Unable to cancel booking."
      );
    }

    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status: "Cancelled" }
          : booking
      )
    );
  } catch (err) {
    alert(err.message);
  }
}


  return (
    <div className="dashboard my-bookings-page">
      <nav className="dashboard-nav">
        <Link to="/parking_slots" className="dashboard-brand">
          Parking <strong>Pulse</strong>
        </Link>

        <Link to="/parking_slots" className="dashboard-logout">
          Back to Parking
        </Link>
      </nav>

      <main className="dashboard-main">
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-eyebrow">YOUR BOOKINGS</span>
            <h1>My Bookings</h1>
            <p className="dashboard-subtitle">
              View your parking reservations and their current status.
            </p>
          </div>
        </section>

        {loading && (
          <div className="dashboard-feedback">
            Loading your bookings...
          </div>
        )}

        {error && (
          <div className="dashboard-feedback">
            {error}
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="empty-slots">
            <h3>No bookings yet</h3>
            <p>Your parking reservations will appear here.</p>
            <Link to="/parking_slots" className="book-now-button">
              Find Parking
            </Link>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <section className="parking-section">
            <div className="parking-section-heading">
              <h2>Your Reservations ({bookings.length})</h2>
            </div>

            <div className="parking-grid">
              {bookings.map((booking) => (
                <article className="parking-card" key={booking.id}>
                  <div className="parking-card-top">
                    <span className="slot-label">
                      MY RESERVATION
                      </span>

                    <span
                      className={`slot-status ${
                        booking.status === "Confirmed"
                          ? "status-available"
                          : "status-other"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="slot-number">
                   <img className="booking-vehicle-image" 
                   src={booking.vehicle_type?.toLowerCase() === "bike"
                    ? bikeImage
                    : carImage
                  }
                  alt={booking.vehicle_type?.toLowerCase() === "bike"
                    ? "Bike"
                    : "Car"
                  }/>
                    <div>
                     <h3>Parking Slot: {booking.slot_number || `Slot ID: ${booking.parking_slot}`}</h3>
                     <p>{booking.business_name || "Parking Business"}</p>
                     <p>Vehicle: {booking.vehicle_type || "Not available"}</p>
                    </div>
                  </div>

                  <div className="slot-divider" />

                  <div className="slot-details">
                    <span>Start</span>
                    <strong>
                      {formatDateTime(booking.start_time)}
                    </strong>
                  </div>

                  <div className="slot-details">
                    <span>End</span>
                    <strong>
                      {formatDateTime(booking.end_time)}
                    </strong>
                  </div>

                  <div className="slot-details">
                    <span>Created</span>
                    <strong>
                      {formatDateTime(booking.created_at)}
                    </strong>
                  </div>

                  {["Pending", "Confirmed"].includes(booking.status) && (
                    <button type="button" 
                    className="book-now-button"
                    onClick={() => handleCancel(booking.id)}>
                      Cancel Booking
                    </button>)}


                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="dashboard-footer">
          <span>Parking Pulse</span>
          <span>Park • Ride • Go</span>
        </footer>
      </main>
    </div>
  );
}
