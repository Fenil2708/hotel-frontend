import { useState, useEffect } from "react";
import { api, authHeaders } from "../../api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminMenuPage() {
  const [categories, setCategories] = useState([]);
  const { token } = useAuth();
  const [tab, setTab] = useState("foods");

  const [form, setForm] = useState({ name: "", category: "", price: "", description: "", image: "", options: [], variants: [] });
  const [optionInput, setOptionInput] = useState("");
  const [variantName, setVariantName] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [catName, setCatName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      const cRes = await api.get("/categories");
      setCategories(cRes.data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = catName.trim();
    if (name.length < 2) {
      toast.error("Category name must be at least 2 characters.");
      return;
    }
    try {
      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, { name }, authHeaders(token));
        toast.success("Category updated!");
      } else {
        await api.post("/categories", { name }, authHeaders(token));
        toast.success(`Category "${name}" added!`);
      }
      setCatName("");
      setEditingCategoryId(null);
      fetchData();
    } catch(err) {
      toast.error(err.response?.data?.message || "Error adding category");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`, authHeaders(token));
      setDeletingCategoryId("");
      toast.success("Category deleted");
      fetchData();
    } catch {
      toast.error("Error deleting category");
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return form.image;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.category) { setFormError("Select a category first."); return; }
    if (form.name.trim().length < 2) { setFormError("Item name must be at least 2 characters."); return; }
    if (!form.variants.length && Number(form.price) <= 0) { setFormError("Price should be greater than 0."); return; }
    if (form.description.trim().length < 8) { setFormError("Description must be at least 8 characters."); return; }
    setUploading(true);
    let imageUrl = form.image;
    
    if (imageFile) {
      imageUrl = await handleImageUpload();
      if (!imageUrl) {
          setUploading(false);
          return;
      }
    }

    const payload = { 
        ...form, 
        image: imageUrl, 
        price: Number(form.price || 0),
        options: form.options
    };
    
    try {
      await api.post("/foods", payload, authHeaders(token));
      toast.success(`"${form.name}" added to menu!`);
      setForm({ name: "", category: "", price: "", description: "", image: "", options: [], variants: [] });
      setImageFile(null);
      setVariantName("");
      setVariantPrice("");
      fetchData();
    } catch {
      toast.error("Error saving food item");
    } finally {
      setUploading(false);
    }
  };

  const addVariant = (name, price) => {
    const cleanName = String(name || "").trim();
    const cleanPrice = Number(price);
    if (!cleanName || !Number.isFinite(cleanPrice) || cleanPrice < 0) {
      toast.error("Enter valid variant name and price.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: cleanName, price: cleanPrice, isDefault: prev.variants.length === 0 }],
      price: prev.variants.length === 0 ? String(cleanPrice) : prev.price,
    }));
    setVariantName("");
    setVariantPrice("");
  };

  const removeVariant = (index) => {
    setForm((prev) => {
      const nextVariants = prev.variants.filter((_, idx) => idx !== index).map((variant, idx) => ({
        ...variant,
        isDefault: idx === 0,
      }));
      return {
        ...prev,
        variants: nextVariants,
        price: nextVariants[0] ? String(nextVariants[0].price) : prev.price,
      };
    });
  };

  const fillClassicPortionPreset = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        { name: "Half Regular", price: 30, isDefault: true },
        { name: "Half Jain", price: 30, isDefault: false },
        { name: "Full Regular", price: 60, isDefault: false },
        { name: "Full Jain", price: 60, isDefault: false },
      ],
      price: "30",
    }));
    toast.success("Added Half/Full + Jain/Regular preset.");
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-section-head">
        <div>
          <p className="eyebrow">Creative Kitchen</p>
          <h1>Menu Studio</h1>
          <p className="hint-text">Build your food catalog, organize categories, and keep presentation worthy of your brand.</p>
        </div>
      </div>

      <div className="segmented-tabs">
        <button className={`segment-tab ${tab === "foods" ? "active" : ""}`} onClick={() => setTab("foods")}>Manage Menu Items</button>
        <button className={`segment-tab ${tab === "categories" ? "active" : ""}`} onClick={() => setTab("categories")}>Manage Categories</button>
      </div>

      {tab === "categories" && (
        <div className="admin-category-grid">
          <div className="panel admin-surface">
            <h2>{editingCategoryId ? "Edit Category" : "Add New Category"}</h2>
            <form onSubmit={handleAddCategory} style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <input placeholder="e.g. Gujarati Dishes" value={catName} onChange={e => setCatName(e.target.value)} required style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc" }} />
                <button type="submit" style={{ padding: "0.75rem 1.5rem", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                  {editingCategoryId ? "Update" : "Add"}
                </button>
            </form>
          </div>
          <div>
            <h2>Existing Categories</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {categories.map(c => (
                    <div key={c._id} className="admin-list-tile">
                        <span style={{ fontWeight: "bold" }}>{c.name}</span>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button onClick={() => { setEditingCategoryId(c._id); setCatName(c.name); }} style={{ padding: "0.25rem 0.5rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}>Edit</button>
                          <button onClick={() => setDeletingCategoryId(c._id)} style={{ padding: "0.25rem 0.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {tab === "foods" && (
        <div>
          <div className="panel admin-surface" style={{ alignSelf: "start" }}>
            <h2>Add Menu Item</h2>
            {formError && <p className="error">{formError}</p>}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc" }} />
              
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc" }}>
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>

              <input type="number" placeholder="Price (₹)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc" }} />

              <div className="variant-builder">
                <div className="variant-builder-head">
                  <div>
                    <label className="menu-mgmt-label">Priced Variants</label>
                    <p className="hint-text">Use this for Half/Full, Jain/Regular, Kids/Family, or any size-style combination with different prices.</p>
                  </div>
                  <button type="button" className="small-btn" onClick={fillClassicPortionPreset}>Add Classic Portion Preset</button>
                </div>
                <div className="variant-builder-grid">
                  <input
                    type="text"
                    placeholder="Variant name e.g. Half Jain"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(e.target.value)}
                  />
                  <button type="button" className="small-btn" onClick={() => addVariant(variantName, variantPrice)}>Add Variant</button>
                </div>
                {form.variants.length > 0 && (
                  <div className="variant-chip-grid">
                    {form.variants.map((variant, index) => (
                      <div key={`${variant.name}-${index}`} className="variant-admin-chip">
                        <span>{variant.name}</span>
                        <strong>₹{variant.price}</strong>
                        <button type="button" onClick={() => removeVariant(index)}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ border: "1px solid #ccc", padding: "0.75rem", borderRadius: "8px", background: "#f9fafb" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>Variations / Options (e.g., Butter, Oil)</label>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <input 
                      type="text" 
                      placeholder="Add an option..." 
                      value={optionInput} 
                      onChange={e => setOptionInput(e.target.value)} 
                      style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if(optionInput.trim()) { setForm({...form, options: [...form.options, optionInput.trim()]}); setOptionInput(""); }
                        }
                      }}
                    />
                    <button type="button" onClick={() => {
                        if(optionInput.trim()) { setForm({...form, options: [...form.options, optionInput.trim()]}); setOptionInput(""); }
                    }} style={{ padding: "0.5rem 1rem", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>+</button>
                </div>
                {form.options.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {form.options.map((opt, i) => (
                      <div key={i} style={{ background: "#e5e7eb", padding: "0.25rem 0.75rem", borderRadius: "16px", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                        {opt}
                        <button type="button" onClick={() => setForm({...form, options: form.options.filter((_, idx) => idx !== i)})} style={{ background: "none", border: "none", color: "red", cursor: "pointer", padding: 0 }}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", minHeight: "80px" }} />
              
              <div style={{ border: "1px dashed #ccc", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Image Upload</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                {form.image && !imageFile && <img src={form.image} alt="preview" style={{ width: "100%", marginTop: "1rem", borderRadius: "8px", height: "120px", objectFit: "cover" }} />}
              </div>

              <button type="submit" disabled={uploading || categories.length === 0} style={{ padding: "1rem", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                {uploading ? "Saving..." : "Add Item"}
              </button>
            </form>
          </div>
        </div>
      )}
      {deletingCategoryId && (
        <div className="modal-overlay" onClick={() => setDeletingCategoryId("")}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Delete this category?</h3>
            <p className="hint-text">Items under this category may be affected.</p>
            <div className="confirm-actions" style={{ marginTop: 12 }}>
              <button className="confirm-cancel-btn" onClick={() => setDeletingCategoryId("")}>Cancel</button>
              <button className="confirm-ok-btn" onClick={() => handleDeleteCategory(deletingCategoryId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
