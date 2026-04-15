import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [seconds, setSeconds] = useState(60);
  const navigate = useNavigate();

  useEffect(() => {
    if (step !== 2 || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t); 
  }, [step, seconds]);

  const requestOtp = async () => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/request-otp", { email });
      setStep(2);
      setSeconds(60);
      toast.success("OTP sent for password reset.");
    } catch (error) {
      const status = error.response?.status;
      const retryAfterSeconds = Number(error.response?.data?.retryAfterSeconds || 0);
      if (status === 429) {
        setStep(2);
        setSeconds(retryAfterSeconds > 0 ? retryAfterSeconds : 60);
      }
      toast.error(error.response?.data?.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/verify-otp", { email, otp });
      navigate("/reset-password", { state: { resetToken: res.data.resetToken, email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" />
      <div className="auth-card glass-effect">
        <h2 className="auth-title">Forgot Password</h2>
        {step === 1 ? (
          <div className="auth-form-modern">
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn-premium btn-primary" onClick={requestOtp} disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
          </div>
        ) : (
          <div className="auth-form-modern">
            <input className="otp-input" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
            <button className="btn-premium btn-primary" onClick={verifyOtp} disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
            <button className="auth-link-btn" onClick={requestOtp} disabled={seconds > 0 || loading}>
              {seconds > 0 ? `Resend OTP in ${seconds}s` : "Resend OTP"}
            </button>
          </div>
        )}
        <Link to="/auth" className="auth-link-btn">Back to Login</Link>
      </div>
    </div>
  );
}
