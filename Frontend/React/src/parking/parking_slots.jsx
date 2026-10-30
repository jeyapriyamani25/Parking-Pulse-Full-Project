
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/parking-pulse-logo.png";

const API = "https://parking-pulse-full-project-1.onrender.com/api";

export default function ParkingSlots() {
  const navigate = useNavigate();

  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`${API}/parking/owners/`, {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load parking owners.");
        }
        return response.json();
      })
      .then((data) => {
        if (active) {
          setOwners(data);
          setError("");
        }
      })
      .catch((err) => {
        console.error("Parking owners error:", err);
        if (active) {
          setError(
            "Could not load parking owners. Please check the Django server."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const isAvailable = (slot) =>
    String(slot.status || "").toLowerCase() === "available";

  const money = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "Price not set";

    return `₹${amount}/hour`;
  };

  const totalSlots = owners.reduce(
    (total, owner) => total + (owner.slots?.length || 0),
    0
  );

  const availableSlots = owners.reduce(
    (total, owner) =>
      total + (owner.slots || []).filter(isAvailable).length,
    0
  );

  const filteredOwners = useMemo(() => {
    const term = search.trim().toLowerCase();

    return owners.filter((owner) => {
      const matchesSearch =
        !term ||
        [
          owner.business_name,
          owner.username,
          owner.phone,
          owner.address,
        ].some((value) =>
          String(value || "").toLowerCase().includes(term)
        );

      const matchesVehicle =
        vehicleFilter === "All" ||
        (owner.slots || []).some(
          (slot) =>
            String(slot.vehicle_type || "").toLowerCase() ===
              vehicleFilter.toLowerCase()
        );

      return matchesSearch && matchesVehicle;
    });
  }, [owners, search, vehicleFilter]);

  const selectedOwnerSlots = selectedOwner
    ? (selectedOwner.slots || []).filter((slot) => {
        if (vehicleFilter === "All") return true;

        return (
          String(slot.vehicle_type || "").toLowerCase() ===
          vehicleFilter.toLowerCase()
        );
      })
    : [];

  const carSlots = selectedOwnerSlots.filter(
    (slot) =>
      String(slot.vehicle_type || "").toLowerCase() === "car"
  );

  const bikeSlots = selectedOwnerSlots.filter(
    (slot) =>
      String(slot.vehicle_type || "").toLowerCase() === "bike"
  );

  function renderSlotCard(slot) {
    const available = isAvailable(slot);

    return (
      <article className="parking-card" key={slot.id}>
        <div className="parking-card-top">
          <span className="slot-label">PARKING SLOT</span>
          <span
            className={`slot-status ${
              available ? "status-available" : "status-other"
            }`}
          >
            {slot.status || "Unknown"}
          </span>
        </div>

        <div className="slot-number">
          <span className="slot-pin" aria-hidden="true">
            {String(slot.vehicle_type).toLowerCase() === "bike"
              ? "🏍️"
              : "🚗"}
          </span>
          <h3>{slot.slot_number}</h3>
        </div>

        <div className="slot-divider" />

        <div className="slot-details">
          <span>Vehicle type</span>
          <strong>{slot.vehicle_type || "Not specified"}</strong>
        </div>

        <div className="slot-details">
          <span>Availability</span>
          <strong className={available ? "available-text" : ""}>
            {available ? "Ready to park" : "Not available"}
          </strong>
        </div>

        <button
  type="button"
  className="book-now-button"
  onClick={() =>
    navigate("/booking", {
      state: {
        slot,
        owner: selectedOwner,
      },
    })
  }
>
  Book Now <span aria-hidden="true">→</span>
</button>
      </article>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-nav">
        <Link to="/parking_slots" className="dashboard-brand">
          <img src={logo} alt="Parking Pulse" />
          <span>
            Parking <strong>Pulse</strong>
          </span>
        </Link>

<div className="dashboard-nav-right">
  <span className="live-indicator">Parking Overview</span>

  <Link to="/my-bookings" className="dashboard-logout">
    My Bookings
  </Link>

  <Link to="/login" className="dashboard-logout">
    Log out
  </Link>
</div>

      </header>

      <main className="dashboard-main">
        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">PARK • RIDE • GO</p>
            <h1>
              {selectedOwner
                ? selectedOwner.business_name
                : "Find your parking spot."}
            </h1>
            <p className="dashboard-subtitle">
              {selectedOwner
                ? "Choose a car or bike parking slot below."
                : "Search parking locations and explore nearby parking owners."}
            </p>
          </div>

          <div className="welcome-icon" aria-hidden="true">
            <span className="parking-icon-letter">P</span>
            <span className="parking-icon-line" />
          </div>
        </section>

        {!selectedOwner && (
          <section className="parking-stats">
            <article className="stat-card">
              <div className="stat-icon total-icon">P</div>
              <div>
                <p>Parking Owners</p>
                <h2>{owners.length}</h2>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon available-icon">✓</div>
              <div>
                <p>Total Slots</p>
                <h2>{totalSlots}</h2>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon occupied-icon">●</div>
              <div>
                <p>Available Slots</p>
                <h2>{availableSlots}</h2>
              </div>
            </article>
          </section>
        )}

        <section className="parking-section">
          {selectedOwner ? (
            <>
              <button
                type="button"
                className="filter-button"
                onClick={() => setSelectedOwner(null)}
              >
                ← Back to parking locations
              </button>

              <div className="parking-section-heading">
                <div>
                  <h2>{selectedOwner.business_name}</h2>
                  <p>
                    Owner: {selectedOwner.username} ·{" "}
                    {selectedOwner.address || "Address not provided"}
                  </p>
                  <p>
                    Contact: {selectedOwner.phone || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="parking-stats">
                <article className="stat-card">
                  <div>
                    <p>Car Price</p>
                    <h2>
                      {money(selectedOwner.car_price_per_hour)}
                    </h2>
                  </div>
                </article>

                <article className="stat-card">
                  <div>
                    <p>Bike Price</p>
                    <h2>
                      {money(selectedOwner.bike_price_per_hour)}
                    </h2>
                  </div>
                </article>
              </div>

              <div className="parking-section-heading">
                <div>
                  <h2>Car Parking</h2>
                  <p>{carSlots.length} car slots</p>
                </div>
              </div>

              {carSlots.length > 0 ? (
                <div className="parking-grid">
                  {carSlots.map(renderSlotCard)}
                </div>
              ) : (
                <p className="dashboard-feedback">
                  No car slots listed for this owner.
                </p>
              )}

              <div className="parking-section-heading">
                <div>
                  <h2>Bike Parking</h2>
                  <p>{bikeSlots.length} bike slots</p>
                </div>
              </div>

              {bikeSlots.length > 0 ? (
                <div className="parking-grid">
                  {bikeSlots.map(renderSlotCard)}
                </div>
              ) : (
                <p className="dashboard-feedback">
                  No bike slots listed for this owner.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="parking-section-heading">
                <div>
                  <h2>Find Parking</h2>
                  <p>Search by business name, area, username or phone.</p>
                </div>
              </div>

              <input
                type="search"
                className="parking-search-input"
                placeholder="Search location (e.g. Chennai, Velachery)"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search parking location"
              />

              <div className="parking-filters">
                {["All", "Car", "Bike"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`filter-button ${
                      vehicleFilter === type ? "active" : ""
                    }`}
                    onClick={() => setVehicleFilter(type)}
                  >
                    {type === "All" ? "All Vehicles" : type}
                  </button>
                ))}
              </div>

              {loading && (
                <p className="dashboard-feedback">
                  Loading parking locations...
                </p>
              )}

              {error && (
                <p className="dashboard-feedback error-message">
                  {error}
                </p>
              )}

              {!loading && !error && filteredOwners.length === 0 && (
                <div className="empty-slots">
                  <div>🅿️</div>
                  <h3>No parking locations found</h3>
                  <p>Try another area or vehicle filter.</p>
                </div>
              )}

              {!loading && !error && filteredOwners.length > 0 && (
                <div className="parking-grid">
                  {filteredOwners.map((owner) => {
                    const ownerSlots = owner.slots || [];
                    const available = ownerSlots.filter(isAvailable).length;
                    const cars = ownerSlots.filter(
                      (slot) =>
                        String(slot.vehicle_type).toLowerCase() === "car"
                    ).length;
                    const bikes = ownerSlots.filter(
                      (slot) =>
                        String(slot.vehicle_type).toLowerCase() === "bike"
                    ).length;

                    return (
                      <article
                        className="parking-card owner-parking-card"
                        key={owner.owner_id}
                      >
                        
                        <h3>{owner.business_name}</h3>
                        <div className="parking-card-top">
                          <span className="slot-label">
                            
                          </span>
                          <span className="slot-status status-available">
                            {available} Available
                          </span>
                        </div>


                        <div className="slot-divider" />

                        <div className="slot-details">
                          <span>Owner username</span>
                          <strong>{owner.username}</strong>
                        </div>

                        <div className="slot-details">
                          <span>Contact</span>
                          <strong>{owner.phone || "Not provided"}</strong>
                        </div>

                        <div className="slot-details">
                          <span>Location</span>
                          <strong>{owner.address || "Not provided"}</strong>
                        </div>

                        <div className="slot-details">
                          <span>Car · {cars} slots</span>
                          <strong>
                            {money(owner.car_price_per_hour)}
                          </strong>
                        </div>

                        <div className="slot-details">
                          <span>Bike · {bikes} slots</span>
                          <strong>
                            {money(owner.bike_price_per_hour)}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="book-now-button"
                          onClick={() => {
                            setSelectedOwner(owner);
                            setVehicleFilter("All");
                          }}
                        >
                          View Parking Slots
                          <span aria-hidden="true"> →</span>
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        <footer className="dashboard-footer">
          <span>Parking Pulse</span>
          <span>Park • Ride • Go</span>
        </footer>
      </main>
    </div>
  );
}

