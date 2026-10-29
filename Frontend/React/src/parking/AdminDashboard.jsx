
import { useEffect, useState } from "react";
import "./AdminDashboard.css";

const API = "http://localhost:8000/api";

export default function AdminDashboard() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Load owner registrations
  async function loadOwners() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/admin/owners/`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not load owner registrations.");
        setOwners([]);
        return;
      }

      setOwners(data);
    } catch {
      setError("Cannot connect to Django server.");
      setOwners([]);
    } finally {
      setLoading(false);
    }
  }

  // Load customer accounts
  async function loadUsers() {
    setUsersLoading(true);
    setUsersError("");

    try {
      const response = await fetch(`${API}/admin/users/`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setUsersError(data.error || "Could not load users.");
        setUsers([]);
        return;
      }

      setUsers(data);
    } catch {
      setUsersError("Cannot connect to Django server.");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    loadOwners();
    loadUsers();
  }, []);

  // Approve or reject an owner
  async function updateOwnerStatus(ownerId, approvalStatus) {
    setUpdatingId(ownerId);
    setError("");
    setMessage("");

    try {
      const csrfResponse = await fetch(`${API}/csrf/`, {
        credentials: "include",
      });

      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;

      if (!csrfResponse.ok || !csrfToken) {
        throw new Error("CSRF token not received. Please try again.");
      }

      const response = await fetch(
        `${API}/admin/owners/${ownerId}/status/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": decodeURIComponent(csrfToken),
          },
          body: JSON.stringify({
            approval_status: approvalStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update owner status.");
      }

      setMessage(data.message || `Owner ${approvalStatus.toLowerCase()} successfully.`);
      await loadOwners();
    } catch (err) {
      setError(err.message || "Cannot connect to Django server.");
    } finally {
      setUpdatingId(null);
    }
  }

  // Admin logout
  function handleLogout() {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("isAdmin");
    sessionStorage.removeItem("isOwner");
    sessionStorage.removeItem("username");
    window.location.href = "/login";
  }

  return (
    <main className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">
            PARKING PULSE · MANAGEMENT
          </p>
          <h1>Admin Dashboard</h1>
          <p>
            Manage parking owner registrations and customer accounts.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            className="admin-button admin-refresh"
            onClick={() => {
              loadOwners();
              loadUsers();
            }}
            disabled={loading || usersLoading}
          >
            Refresh Data
          </button>

          <button
            className="admin-button admin-logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      {/* Status messages */}
      {message && (
        <p className="admin-notice admin-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="admin-notice admin-error" role="alert">
          {error}
        </p>
      )}

      {/* Owner registrations */}
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>Parking Owner Registrations</h2>
            <p>Review applications and manage owner approval.</p>
          </div>

          <span className="admin-count">
            {owners.length} Owners
          </span>
        </div>

        {loading ? (
          <p className="admin-empty">Loading owner registrations...</p>
        ) : owners.length === 0 && !error ? (
          <p className="admin-empty">No owner registrations found.</p>
        ) : owners.length > 0 ? (
          <div className="admin-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {owners.map((owner) => (
                  <tr key={owner.id}>
                    <td className="admin-business-name">
                      {owner.business_name}
                    </td>
                    <td>{owner.username}</td>
                    <td>{owner.email}</td>
                    <td>{owner.phone}</td>
                    <td>{owner.business_address}</td>
                    <td>
                      <span
                        className={`admin-status status-${(
                          owner.approval_status || "Pending"
                        ).toLowerCase()}`}
                      >
                        {owner.approval_status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-buttons">
                        {owner.approval_status !== "Approved" && (
                          <button
                            className="admin-approve"
                            onClick={() =>
                              updateOwnerStatus(owner.id, "Approved")
                            }
                            disabled={updatingId !== null}
                          >
                            {updatingId === owner.id
                              ? "Updating..."
                              : "Approve"}
                          </button>
                        )}

                        {owner.approval_status !== "Rejected" && (
                          <button
                            className="admin-reject"
                            onClick={() =>
                              updateOwnerStatus(owner.id, "Rejected")
                            }
                            disabled={updatingId !== null}
                          >
                            {updatingId === owner.id
                              ? "Updating..."
                              : "Reject"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {/* Customer accounts */}
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>Customer Details</h2>
            <p>View registered customer accounts.</p>
          </div>

          <span className="admin-count">
            {users.length} Users
          </span>
        </div>

        {usersLoading ? (
          <p className="admin-empty">Loading user details...</p>
        ) : usersError ? (
          <p className="admin-notice admin-error" role="alert">
            {usersError}
          </p>
        ) : users.length === 0 ? (
          <p className="admin-empty">No users found.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Joined Date</th>
                  <th>Account Status</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="admin-business-name">
                      {user.username}
                    </td>
                    <td>{user.email || "Not provided"}</td>
                    <td>
                      {user.date_joined
                        ? new Date(user.date_joined).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <span
                        className={`admin-status ${
                          user.is_active
                            ? "status-approved"
                            : "status-rejected"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="admin-footer">
        Parking Pulse       .      Park Smart       .       Park Easy
      </footer>
    </main>
  );
}
