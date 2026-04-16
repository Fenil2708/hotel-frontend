import { useState } from "react";
import { api, authHeaders } from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, token, login } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
    avatar: user?.avatar || "",
  });
  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [imageFile, setImageFile] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [passError, setPassError] = useState("");

  const validateProfile = () => {
    if (form.name.trim().length < 2) return "Name must be at least 2 characters.";
    if (form.mobile && !/^[0-9+\-\s]{8,15}$/.test(form.mobile)) return "Enter valid mobile number.";
    if (form.avatar && !/^https?:\/\/.+/i.test(form.avatar)) return "Avatar must be a valid URL.";
    return "";
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const err = validateProfile();
    setFormError(err);
    if (err) return;
    setSaving(true);
    try {
      let avatar = form.avatar;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const up = await api.post("/upload", formData, authHeaders(token));
        avatar = up.data.imageUrl;
      }
      const res = await api.put("/auth/profile", { ...form, avatar, name: form.name.trim() }, authHeaders(token));
      login(res.data);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword.length < 8) {
      setPassError("New password must be at least 8 characters.");
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError("New password and confirm password do not match.");
      return;
    }
    setPassError("");
    setPassSaving(true);
    try {
      await api.put("/auth/change-password", { oldPassword: passForm.oldPassword, newPassword: passForm.newPassword }, authHeaders(token));
      setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="profile-shell">
      <div className="profile-hero">
        {form.avatar ? (
          <img src={form.avatar} alt={user?.name} className="profile-avatar-lg" />
        ) : (
          <div className="profile-avatar-lg">{(user?.name || "U")[0]}</div>
        )}
        <div>
          <p className="eyebrow">Guest Profile</p>
          <h2>{user?.name || "Customer Profile"}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="panel profile-panel">
          <h3>Profile Information</h3>
          <p className="hint-text">Keep your dining identity polished for quicker ordering and a smoother table experience.</p>
          {formError && <p className="error">{formError}</p>}
          <form className="auth-form" onSubmit={handleUpdateProfile}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
            <input type="email" value={user?.email || ""} disabled />
            <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Mobile number" />
            <input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="Profile image URL" />
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</button>
          </form>
        </div>

        <div className="panel profile-panel">
          <h4>Change Password</h4>
          <p className="hint-text">Protect your account with a stronger password and keep your profile secure.</p>
          {passError && <p className="error">{passError}</p>}
          <form className="auth-form" onSubmit={handleChangePassword}>
            <div className="password-wrap">
              <input type={showPass ? "text" : "password"} value={passForm.oldPassword} onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })} placeholder="Current password" required />
              <button type="button" className="toggle-pass-btn" onClick={() => setShowPass((s) => !s)}>{showPass ? "Hide" : "Show"}</button>
            </div>
            <input type={showPass ? "text" : "password"} value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} placeholder="New password" required />
            <input type={showPass ? "text" : "password"} value={passForm.confirmPassword} onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })} placeholder="Confirm new password" required />
            <button type="submit" disabled={passSaving}>{passSaving ? "Updating..." : "Update Password"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
