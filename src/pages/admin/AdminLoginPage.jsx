import { useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter valid email address");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    try {
      const res = await api.post("/auth/admin/login", { email, password });
      login(res.data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" />
      <div className="auth-card glass-effect">
        <p className="eyebrow auth-eyebrow">Operations Access</p>
        <h2 className="auth-title">Admin Login</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleLogin} className="auth-form-modern">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Admin Email" />
          <div className="password-wrap">
            <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" />
            <button type="button" className="toggle-pass-btn" onClick={() => setShowPass((s) => !s)}>{showPass ? "Hide" : "Show"}</button>
          </div>
          <button type="submit" className="btn-premium btn-primary">Login to System</button>
        </form>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link to="/admin/register" className="auth-link-btn">Need an Admin account? Register</Link>
        </div>
      </div>
    </div>
  );
}
