import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/parking-pulse-logo.png";

const API = "http://localhost:8000/api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || data.detail || "Registration failed");
        return;
      }

      setMessage("Registration successful! You can now log in.");
      setUsername("");
      setEmail("");
      setPassword("");
    } catch {
      setMessage("Cannot connect to Django server.");
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand">
        <img
          src={logo}
          alt="Parking Pulse logo"
          className="auth-logo"
        />

        <h1>Join Parking Pulse</h1>
        <p>Create your account and make parking simpler.</p>

        <div className="auth-features">
          <span>✓ Easy account creation</span>
          <span>✓ Bike & car parking</span>
          <span>✓ Park | Ride | Go</span>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-card">
          <p className="auth-eyebrow">GET STARTED</p>
          <h2>Create an account</h2>
          <p className="auth-description">
            Fill in your details to get started.
          </p>

          <form onSubmit={handleRegister}>
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <button type="submit" className="auth-submit">
              Create Account →
            </button>
          </form>

          {message && (
            <p role="status" className="auth-message">
              {message}
            </p>
          )}

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
