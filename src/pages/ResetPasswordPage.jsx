import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetToken, email } = location.state || {};
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const invalidState = useMemo(() => !resetToken, [resetToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/reset", { resetToken, newPassword: password });
      toast.success("Password reset successful. Please login.");
      navigate("/auth");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  if (invalidState) {
    return (
      <div className="auth-shell">
        <div className="auth-backdrop" />
        <div className="auth-card glass-effect">
          <p className="error">Invalid reset session. Please request OTP again.</p>
          <button className="btn-premium btn-primary" onClick={() => navigate("/forgot-password")}>Go to Forgot Password</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" />
      <div className="auth-card glass-effect">
        <p className="eyebrow auth-eyebrow">Secure Reset</p>
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">for {email}</p>
        <form className="auth-form-modern" onSubmit={handleSubmit}>
          <div className="password-wrap">
            <input type={showPass ? "text" : "password"} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="toggle-pass-btn" onClick={() => setShowPass((s) => !s)}>{showPass ? "Hide" : "Show"}</button>
          </div>
          <input type={showPass ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button className="btn-premium btn-primary" type="submit" disabled={loading}>{loading ? "Saving..." : "Reset Password"}</button>
        </form>
      </div>
    </div>
  );
}
