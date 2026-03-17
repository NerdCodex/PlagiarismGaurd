import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate slight delay for UX
    setTimeout(() => {
      if (username === "admin" && password === "2255") {
        sessionStorage.setItem("adminAuth", "true");
        navigate("/admin");
      } else {
        setError("Invalid username or password");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="glass-card login-card">
        <div className="lock-icon">🔒</div>
        <h2>Admin Access</h2>
        <p className="login-sub">Enter your credentials to continue</p>

        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="input-label" htmlFor="admin-username">
              Username
            </label>
            <input
              id="admin-username"
              className="input-field"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-accent"
            id="admin-login-btn"
            disabled={loading}
            style={{ width: "100%", marginTop: 8 }}
          >
            {loading ? <span className="spinner" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
