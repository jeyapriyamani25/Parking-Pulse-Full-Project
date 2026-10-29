import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/parking-pulse-logo.png";
import { Link } from "react-router-dom";


const API = "http://localhost:8000/api";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    try {
      const csrfResponse = await fetch(`${API}/csrf/`, {
        method: "GET",
        credentials: "include",
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      if (!csrfToken) {
        setMessage("CSRF token not received from Django.");
        return;
      }


      // Step 3: Send login details to Django
      const response = await fetch(`${API}/login/`, {
        method: "POST",
        credentials: "include",
        
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": decodeURIComponent(csrfToken),
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || data.detail || "Login failed");
        return;
      }

      
sessionStorage.setItem("isLoggedIn", "true");
sessionStorage.setItem("username", data.username);
sessionStorage.setItem("isAdmin", String(data.is_admin));
sessionStorage.setItem("isOwner", String(data.is_owner));

if (data.is_admin) {
  setMessage("Admin login successful!");
  navigate("/admin-dashboard");
} else if (data.is_owner) {
  setMessage("Owner login successful!");
  navigate("/owner-dashboard");
} else {
  setMessage("User login successful!");
  navigate("/parking_slots");
}

    } catch {
      setMessage("Cannot connect to Django server.");
    }
  }

  
return (
  <div className="auth-page">
    <section className="auth-brand">
      <img
        src={logo}
        alt="Parking Pulse - Park, Ride, Go"
        className="auth-logo"
      />
      <h1>Welcome to Parking Pulse</h1>
      <p>Your perfect parking spot is just a few clicks away.</p>

      <div className="auth-features">
        <span>✓ Easy parking access</span>
        <span>✓ Bike & car parking</span>
        <span>✓ Simple and convenient</span>
      </div>
    </section>

    <section className="auth-form-section">
      <div className="auth-card">
        <p className="auth-eyebrow">WELCOME BACK</p>
        <h2>Sign in to your account</h2>
        <p className="auth-description">
          Enter your details to continue.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-submit">
            Sign In →
          </button>
        </form>

        {message && (
          <p role="status" className="auth-message">
            {message}
          </p>
        )}

        <p className="auth-switch">
          New to Parking Pulse?{" "}
          <a href="/register">Create an account</a>

          <p className="auth-switch">
            Are you a Parking Owner?{" "}
            <Link to="/owner-register">Create an account</Link></p>
        </p>
      </div>
    </section>
  </div>
);

}