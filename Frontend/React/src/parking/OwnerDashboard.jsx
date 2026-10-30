import { useEffect, useState } from "react";
import "./OwnerDashboard.css";

const API = "https://parking-pulse-full-project-1.onrender.com/api";

export default function OwnerDashboard() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [pricing, setPricing] = useState(null);
  const [pricingError, setPricingError] = useState("");
  const [slotNumber, setSlotNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Car");

  const username = sessionStorage.getItem("username") || "Owner";

  async function loadSlots() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/owner/slots/`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Unable to load slots.");
      }

      setSlots(data);
    } catch (error) {
      setMessage(error.message || "Unable to connect to Django.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
    loadPricing();
  }, []);



  async function addSlot(event) {
    event.preventDefault();
    setMessage("");

    try {
      const csrfResponse = await fetch(`${API}/csrf/`, {
        credentials: "include",
      });
      const csrfData = await csrfResponse.json();

      if (!csrfData.csrfToken) {
        throw new Error("CSRF token not received. Please log in again.");
      }

      const response = await fetch(`${API}/owner/slots/create/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": decodeURIComponent(csrfData.csrfToken),
        },
        body: JSON.stringify({
          slot_number: slotNumber,
          vehicle_type: vehicleType,
          status: "Available",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || JSON.stringify(data) ||
          "Could not add slot."
        );
      }

      setSlotNumber("");
      setMessage("Parking slot added successfully.");
      await loadSlots();
    } catch (error) {
      setMessage(error.message || "Could not add slot.");
    }
  }



  async function deleteSlot(slotId) {
    if (!window.confirm("Are you sure you want to delete this slot?")) {
      return;
    }

    setMessage("");

    try {
      const csrfResponse = await fetch(`${API}/csrf/`, {
        credentials: "include",
      });
      const csrfData = await csrfResponse.json();

      if (!csrfData.csrfToken) {
        throw new Error("CSRF token not received. Please log in again.");
      }

      const response = await fetch(`${API}/owner/slots/${slotId}/delete/`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRFToken": decodeURIComponent(csrfData.csrfToken),
        },
      });

      if (!response.ok) {
        let data = {};
        try {
          data = await response.json();
        } catch {
          // Response may not contain JSON.
        }
        throw new Error(data.detail || data.error || "Could not delete slot.");
      }

      setMessage("Parking slot deleted successfully.");
      await loadSlots();
    } catch (error) {
      setMessage(error.message || "Could not delete slot.");
    }
  }



async function loadPricing() {
  setPricingError("");

  try {
    const response = await fetch(`${API}/owner/pricing/`, {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.detail || "Unable to load pricing."
      );
    }

    setPricing(data);
  } catch (error) {
    setPricingError(error.message || "Unable to load pricing.");
  }
}
  


async function logout() {
  try {
    const csrfResponse = await fetch(`${API}/csrf/`, {
      credentials: "include",
    });
    const csrfData = await csrfResponse.json();

    await fetch(`${API}/logout/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRFToken": decodeURIComponent(csrfData.csrfToken),
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("isAdmin");
    sessionStorage.removeItem("isOwner");
    sessionStorage.removeItem("username");
    window.location.href = "/login";
  }
}


  return (
    <main className="owner-dashboard">
      <header className="owner-header">
        <div>
          <p className="owner-brand">PARKING PULSE · MANAGEMENT</p>
          <h1>Welcome, {username}!</h1>
          <p className="owner-subtitle">
            Manage your parking slots and check their availability.
          </p>
        </div>

        <button className="pp-button logout-button" onClick={logout}>
          Log out
        </button>
      </header>

      <section className="owner-section">
  <h2>Parking Price</h2>

  {pricingError && (
    <p className="owner-message" role="alert">
      {pricingError}
    </p>
  )}

  {!pricing && !pricingError && (
    <p>Loading pricing...</p>
  )}

  {pricing && (
    <>
      <h3>{pricing.business_name}</h3>

      <div className="pricing-cards">
        <div className="pricing-card">
          <h3>🚗 Car Parking</h3>
          <p>
            ₹{Number(pricing.car_price_per_hour).toFixed(2)} / hour
          </p>
        </div>

        <div className="pricing-card">
          <h3>🏍️ Bike Parking</h3>
          <p>
            ₹{Number(pricing.bike_price_per_hour).toFixed(2)} / hour
          </p>
        </div>
      </div>
    </>
  )}
</section>

      <section className="owner-section add-slot-section">
        <h2>Add Parking Slot</h2>

        <form className="add-slot-form" onSubmit={addSlot}>
          <input
            value={slotNumber}
            onChange={(event) => setSlotNumber(event.target.value)}
            placeholder="Slot number (e.g. A101)"
            required
          />

          <select
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value)}
          >
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
          </select>

          <button className="pp-button" type="submit">
            + Add Slot
          </button>
        </form>
      </section>

      {message && (
        <p className="owner-message" role="status">
          {message}
        </p>
      )}

      <section className="owner-section slots-section">
        <div className="slots-heading">
          <div>
            <h2>Parking Slots</h2>
            <p className="owner-subtitle">
              Total slots: {slots.length}
            </p>
          </div>

          <button
            className="pp-button refresh-button"
            onClick={loadSlots}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading && <p>Loading slots...</p>}

        {!loading && slots.length === 0 && (
          <p className="empty-slots">
            No slots found yet. Add your first slot above.
          </p>
        )}

        {!loading && slots.length > 0 && (
          <div className="slots-table-wrapper">
            <table className="slots-table">
              <thead>
                <tr>
                  <th>Slot Number</th>
                  <th>Vehicle Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id}>
                    <td className="slot-number">{slot.slot_number}</td>
                    <td>{slot.vehicle_type}</td>
                    <td>
                      <span
                        className={`slot-status ${
                          slot.status === "Available"
                            ? "status-available"
                            : "status-booked"
                        }`}
                      >
                        {slot.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="pp-button delete-button"
                        onClick={() => deleteSlot(slot.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="owner-footer">
        Parking Pulse · Park Smart, Park Easy
      </footer>
    </main>
  );
}

  