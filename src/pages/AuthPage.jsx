import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", otp: "" });
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const { login, clearTableSession } = useAuth();
  const navigate = useNavigate();

  const emailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = (password) => password.length >= 8;

  const validateSignup = () => {
    if (form.name.trim().length < 2) return "Name must be at least 2 characters.";
    if (!emailValid(form.email)) return "Enter valid email address.";
    if (!passwordValid(form.password)) return "Password must be at least 8 characters.";
    return "";
  };

  useEffect(() => {
    if (isLogin || step !== 2 || seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [isLogin, step, seconds]);

  const requestSignupOtp = async () => {
    setLoading(true);
    try {
      await api.post("/auth/customer/request-otp", { ...form, role: "user" });
      setStep(2);
      setSeconds(60);
      setInlineError("");
      toast.success("Golden code sent to your email! ✨");
    } catch (err) {
      const status = err.response?.status;
      const retryAfterSeconds = Number(err.response?.data?.retryAfterSeconds || 0);
      if (status === 429) {
        setStep(2);
        setSeconds(retryAfterSeconds > 0 ? retryAfterSeconds : 60);
      }
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
      if (err.response?.data?.message?.includes("taken")) setIsLogin(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const err = validateSignup();
    setInlineError(err);
    if (err) return;
    requestSignupOtp();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(form.otp.trim())) {
      setInlineError("OTP must be 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/customer/verify-otp", { email: form.email, otp: form.otp });
      clearTableSession();
      login(res.data);
      setInlineError("");
      toast.success("Welcome to our elite circle! 🥂");
      navigate("/", { replace: true });
    } catch(err) {
      toast.error(err.response?.data?.message || "The code doesn't match our records.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailValid(form.email)) {
      setInlineError("Enter valid email address.");
      return;
    }
    if (!form.password) {
      setInlineError("Password is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/customer/login", { email: form.email, password: form.password });
      login(res.data);
      setInlineError("");
      toast.success("Welcome back, valued guest!");
      navigate("/");
    } catch(err) {
      const apiMessage = err.response?.data?.message || "Check your credentials and try again.";
      setInlineError(apiMessage.includes("Invalid") ? "Wrong email or password." : apiMessage);
      toast.error(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" />
      <div className="auth-card glass-effect animate-fade-in">
        <div className="auth-icon">✦</div>
        <p className="eyebrow auth-eyebrow">Fine Dining Access</p>
        <h1 className="auth-title">
          {isLogin ? "Welcome Guest" : "Join The Feast"}
        </h1>
        <p className="auth-subtitle">
          {isLogin ? "Savor the flavors of elite dining" : "Create an account for personalized service"}
        </p>

        <div className="auth-stack">
          {inlineError && <p className="error auth-error">{inlineError}</p>}
          {isLogin ? (
            <form onSubmit={handleLogin} className="auth-form-modern">
              <input type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              <div className="password-wrap">
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                <button type="button" className="toggle-pass-btn" onClick={() => setShowPassword((s) => !s)}>{showPassword ? "Hide" : "Show"}</button>
              </div>
              <button type="submit" className="btn-premium btn-primary" disabled={loading}>
                {loading ? "Verifying..." : "Enter Restaurant"}
              </button>
              <Link to="/forgot-password" className="auth-link-btn">Forgot Password?</Link>
            </form>
          ) : step === 1 ? (
            <form onSubmit={handleRequestOtp} className="auth-form-modern">
              <input type="text" placeholder="Your Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              <div className="password-wrap">
                <input type={showPassword ? "text" : "password"} placeholder="Secure Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength="8" required />
                <button type="button" className="toggle-pass-btn" onClick={() => setShowPassword((s) => !s)}>{showPassword ? "Hide" : "Show"}</button>
              </div>
              <button type="submit" className="btn-premium btn-primary" disabled={loading}>
                {loading ? "Sending..." : "Send Golden Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="auth-form-modern">
              <p className="otp-hint">We sent a code to <span>{form.email}</span></p>
              <input className="otp-input" type="text" placeholder="Enter 6-digit code" value={form.otp} onChange={e => setForm({...form, otp: e.target.value})} required maxLength="6" />
              <button type="submit" className="btn-premium btn-primary" disabled={loading}>
                {loading ? "Confirming..." : "Verify & Sign In"}
              </button>
              <button type="button" className="auth-link-btn" onClick={requestSignupOtp} disabled={seconds > 0 || loading}>
                {seconds > 0 ? `Resend OTP in ${seconds}s` : "Resend OTP"}
              </button>
              <button type="button" className="auth-link-btn" onClick={() => setStep(1)}>
                ← Edit Details
              </button>
            </form>
          )}

          <div className="auth-toggle-wrap">
            {step === 1 && (
              <button onClick={() => { setIsLogin(!isLogin); }} className="auth-link-btn muted">
                {isLogin ? "New guest? Create account" : "Already a member? Sign in"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
