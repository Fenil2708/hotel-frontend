import { useState } from "react";
import { api } from "../../api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function AdminRegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter valid email address");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    try {
      await api.post("/auth/admin/register", form);
      toast.success("Admin registered successfully! You can now log in.");
      navigate("/admin/login");
    } catch(err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" />
      <div className="auth-card glass-effect">
        <p className="eyebrow auth-eyebrow">Operations Access</p>
        <h2 className="auth-title">Admin Register</h2>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleRegister} className="auth-form-modern">
          <input type="text" placeholder="Admin Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <input type="email" placeholder="Admin Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <div className="password-wrap">
            <input type={showPass ? "text" : "password"} placeholder="Strict Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength="8" />
            <button type="button" className="toggle-pass-btn" onClick={() => setShowPass((s) => !s)}>{showPass ? "Hide" : "Show"}</button>
          </div>
          <button type="submit" className="btn-premium btn-primary">Register Admin Account</button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link to="/admin/login" className="auth-link-btn">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
