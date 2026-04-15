import { useState } from "react";
import { api, authHeaders } from "../../api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminProfilePage() {
  const { user, token, login } = useAuth();
  const [form, setForm] = useState({ 
    name: user?.name || "", 
    mobile: user?.mobile || "", 
    avatar: user?.avatar || "" 
  });
  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passSaving, setPassSaving] = useState(false);

  const handleImageUpload = async () => {
    if (!imageFile) return form.avatar;
    const formData = new FormData();
    formData.append("image", imageFile);
    try {
      const res = await api.post("/upload", formData, authHeaders(token));
      return res.data.imageUrl;
    } catch {
      toast.error("Image upload failed");
      return null;
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (form.mobile && !/^[0-9+\-\s]{8,15}$/.test(form.mobile)) {
      toast.error("Enter a valid mobile number");
      return;
    }
    setSaving(true);
    let avatarUrl = form.avatar;
    if (imageFile) {
        avatarUrl = await handleImageUpload();
        if(!avatarUrl) { setSaving(false); return; }
    }
    try {
      const res = await api.put("/auth/profile", { ...form, avatar: avatarUrl }, authHeaders(token));
      login(res.data);
      toast.success("Profile updated successfully! 🙌");
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setPassSaving(true);
    try {
      await api.put("/auth/change-password", passForm, authHeaders(token));
      toast.success("Password updated securely! 🔒");
      setPassForm({ oldPassword: "", newPassword: "" });
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Admin Profile Settings</h1>

      <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "var(--shadow-sm)", marginBottom: "2rem" }}>
        <h2>Update Information</h2>
        <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          
          <div className="profile-avatar-row" style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "1rem" }}>
            <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#ccc", overflow: "hidden", border: "4px solid white", boxShadow: "var(--shadow-md)" }}>
              {imageFile ? (
                <img src={URL.createObjectURL(imageFile)} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : form.avatar ? (
                <img src={form.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "2rem", color: "white" }}>👤</div>
              )}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Profile Picture</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
            </div>
          </div>

          <label style={{ fontWeight: "bold" }}>Full Name</label>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc" }} />
          
          <label style={{ fontWeight: "bold" }}>Mobile Number</label>
          <input type="text" placeholder="e.g. +91 9876543210" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc" }} />

          <label style={{ fontWeight: "bold" }}>Email (Read Only)</label>
          <input type="email" value={user?.email || ""} disabled style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", background: "#f3f4f6" }} />

          <button type="submit" disabled={saving} style={{ padding: "1rem", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "1rem" }}>
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </form>
      </div>

      <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "var(--shadow-sm)" }}>
        <h2>Change Password</h2>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <label style={{ fontWeight: "bold" }}>Current Password</label>
          <div className="password-wrap">
            <input type={showPass ? "text" : "password"} value={passForm.oldPassword} onChange={e => setPassForm({...passForm, oldPassword: e.target.value})} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc" }} />
            <button type="button" className="toggle-pass-btn" onClick={() => setShowPass((s) => !s)}>{showPass ? "Hide" : "Show"}</button>
          </div>
          
          <label style={{ fontWeight: "bold" }}>New Password</label>
          <input type={showPass ? "text" : "password"} value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} required minLength="8" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc" }} />

          <button type="submit" disabled={passSaving} style={{ padding: "1rem", background: "#1f2937", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "1rem" }}>
            {passSaving ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
