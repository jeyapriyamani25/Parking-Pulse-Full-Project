import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/parking-pulse-logo.png";

const API = "http://localhost:8000/api";

export default function OwnerRegister() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [carPrice, setCarPrice] = useState("");
  const [bikePrice, setBikePrice] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`${API}/owner/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          business_name: businessName,
          phone,
          business_address: businessAddress,
          car_price_per_hour: carPrice,
          bike_price_per_hour: bikePrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data === "object"
            ? Object.entries(data)
                .map(([key, value]) =>
                  `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
                )
                .join(" | ")
            : "Owner registration failed";

        setMessage(errorMessage || "Owner registration failed");
        return;
      }

      setIsSuccess(true);
      setMessage(
        data.message ||
          "Registration successful! Your account is waiting for admin approval."
      );

      setUsername("");
      setEmail("");
      setPassword("");
      setBusinessName("");
      setPhone("");
      setBusinessAddress("");
    } catch {
      setMessage("Cannot connect to Django server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page owner-register-page">
      <section className="auth-brand">
        <img
          src={logo}
          alt="Parking Pulse logo"
          className="auth-logo"
        />

        <h1>Partner with Parking Pulse</h1>
        <p>Register your parking business and manage your parking slots.</p>

        <div className="auth-features">
          <span>✓ Manage your parking slots</span>
          <span>✓ Track parking availability</span>
          <span>✓ Access your owner dashboard after approval</span>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-card">
          <p className="auth-eyebrow">PARKING OWNER</p>
          <h2>Create an owner account</h2>
          <p className="auth-description">
            Enter your account and business details.
          </p>

          <form onSubmit={handleRegister}>
            <label htmlFor="owner-username">Username</label>
            <input
              id="owner-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="owner-email">Email address</label>
            <input
              id="owner-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="owner-password">Password</label>
            <input
              id="owner-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <label htmlFor="owner-business-name">Business name</label>
            <input
              id="owner-business-name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />

            <label htmlFor="owner-phone">Phone number</label>
            <input
              id="owner-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />

            <label htmlFor="owner-business-address">Business address</label>
            <textarea
              id="owner-business-address"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              rows={3}
              required
            />

            <label htmlFor="owner-car-price">
  Car parking price (₹ per hour)
</label>
<input
  id="owner-car-price"
  type="number"
  min="0.01"
  step="0.01"
  value={carPrice}
  onChange={(e) => setCarPrice(e.target.value)}
  required
/>

<label htmlFor="owner-bike-price">
  Bike parking price (₹ per hour)
</label>
<input
  id="owner-bike-price"
  type="number"
  min="0.01"
  step="0.01"
  value={bikePrice}
  onChange={(e) => setBikePrice(e.target.value)}
  required
/>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Register as Owner →"}
            </button>
          </form>

          {message && (
            <p
              role="status"
              className="auth-message"
              style={{ color: isSuccess ? "green" : undefined }}
            >
              {message}
            </p>
          )}

          <p className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>

          <p className="auth-switch">
            Registering as a customer? <Link to="/register">Customer registration</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
