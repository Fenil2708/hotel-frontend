import { useEffect, useMemo, useState } from "react";
import { api, authHeaders } from "../../api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminMenuManagementPage() {
  const { token } = useAuth();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingFood, setEditingFood] = useState(null);
  const [deletingFoodId, setDeletingFoodId] = useState("");
  const [editForm, setEditForm] = useState({ name: "", category: "", price: "", description: "", image: "" });
  const [editImageFile, setEditImageFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFoods = async () => {
    try {
      const [fRes, cRes] = await Promise.all([api.get("/foods"), api.get("/categories")]);
      setFoods(fRes.data);
      setCategories(cRes.data);
    } catch {
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/foods/${id}`, authHeaders(token));
      setFoods((prev) => prev.filter((f) => f._id !== id));
      setDeletingFoodId("");
      toast.success("Item deleted");
    } catch {
      toast.error("Could not delete item");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return foods.filter((f) => {
      const byCat = selectedCategory === "all" || f.category?._id === selectedCategory;
      const bySearch = !q || f.name?.toLowerCase().includes(q) || f.category?.name?.toLowerCase().includes(q);
      return byCat && bySearch;
    });
  }, [foods, search, selectedCategory]);

  const openEdit = (food) => {
    setEditingFood(food);
    setEditImageFile(null);
    setEditForm({
      name: food.name || "",
      category: food.category?._id || "",
      price: food.price || "",
      description: food.description || "",
      image: food.image || "",
    });
  };

  const saveEdit = async () => {
    if (editForm.name.trim().length < 2) return toast.error("Name too short");
    if (Number(editForm.price) <= 0) return toast.error("Price should be greater than 0");
    if (!editForm.category) return toast.error("Select category");
    try {
      let imageUrl = editForm.image;
      if (editImageFile) {
        const fd = new FormData();
        fd.append("image", editImageFile);
        const up = await api.post("/upload", fd, authHeaders(token));
        imageUrl = up.data.imageUrl;
      }
      await api.put(`/foods/${editingFood._id}`, {
        ...editingFood,
        name: editForm.name.trim(),
        category: editForm.category,
        price: Number(editForm.price),
        description: editForm.description.trim(),
        image: imageUrl,
      }, authHeaders(token));
      toast.success("Item updated");
      setEditingFood(null);
      setEditImageFile(null);
      fetchFoods();
    } catch {
      toast.error("Could not update item");
    }
  };

  return (
    <div className="menu-management-page">
      <div className="menu-management-toolbar">
        <h1>Menu Management</h1>
        <input
          className="menu-management-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search food/category"
        />
        <select className="menu-management-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className="admin-menu-item-grid">
          {filtered.map((f) => (
            <div key={f._id} className="menu-mgmt-card">
              <img src={f.image} alt={f.name} className="menu-mgmt-card-image" />
              <div className="menu-mgmt-card-content">
                <h4>{f.name}</h4>
                <p className="menu-mgmt-category">{f.category?.name || "No Category"}</p>
                <p className="menu-mgmt-price">Rs. {f.price}</p>
                {f.options?.length > 0 && <p className="menu-mgmt-options">Options: {f.options.join(", ")}</p>}
              </div>
              <div className="menu-mgmt-actions">
                <button className="small-btn" onClick={() => openEdit(f)}>Edit</button>
                <button className="small-btn danger-btn" onClick={() => setDeletingFoodId(f._id)}>Delete</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="menu-mgmt-empty">No menu items found.</p>}
        </div>
      )}
      {editingFood && (
        <div className="modal-overlay" onClick={() => setEditingFood(null)}>
          <div className="modal-card menu-mgmt-edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="menu-mgmt-edit-title">Edit Menu Item</h3>
            <div className="auth-form menu-mgmt-edit-form">
              <label className="menu-mgmt-label">Item Name</label>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Enter food name" />

              <label className="menu-mgmt-label">Category</label>
              <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>

              <label className="menu-mgmt-label">Price (Rs.)</label>
              <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} placeholder="Enter price" />

              <label className="menu-mgmt-label">Description</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Enter dish description" />

              <label className="menu-mgmt-label">Image URL</label>
              <input value={editForm.image} onChange={(e) => setEditForm({ ...editForm, image: e.target.value })} placeholder="Paste image url" />

              <label className="menu-mgmt-label">Or Upload New Image</label>
              <input type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} />

              {(editImageFile || editForm.image) && (
                <img
                  src={editImageFile ? URL.createObjectURL(editImageFile) : editForm.image}
                  alt="preview"
                  className="menu-mgmt-edit-preview"
                />
              )}

              <button className="option-confirm-btn" onClick={saveEdit}>Save</button>
              <button className="option-cancel-btn" onClick={() => setEditingFood(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {deletingFoodId && (
        <div className="modal-overlay" onClick={() => setDeletingFoodId("")}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Delete this item?</h3>
            <p className="hint-text">This action cannot be undone.</p>
            <div className="confirm-actions" style={{ marginTop: 12 }}>
              <button className="confirm-cancel-btn" onClick={() => setDeletingFoodId("")}>Cancel</button>
              <button className="confirm-ok-btn" onClick={() => handleDelete(deletingFoodId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
