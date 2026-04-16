import { useEffect, useState } from "react";
import { api, authHeaders } from "../../api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminTablesPage() {
  const { token } = useAuth();
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState({ tableNumber: "", capacity: "" });
  const [loading, setLoading] = useState(true);
  const [highlightedTableId, setHighlightedTableId] = useState("");

  const fetchTables = async () => {
    try {
      const res = await api.get("/table-catalog", authHeaders(token));
      setTables(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSeedDefaults = async () => {
    await api.post("/table-catalog/seed-defaults", {}, authHeaders(token));
    toast.success("Default 8 tables ensured.");
    fetchTables();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.tableNumber || !form.capacity) return;
    try {
      await api.post("/table-catalog", { tableNumber: Number(form.tableNumber), capacity: Number(form.capacity) }, authHeaders(token));
      setForm({ tableNumber: "", capacity: "" });
      toast.success("Table added.");
      fetchTables();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add table");
    }
  };

  const handleToggle = async (id, current) => {
    await api.put(`/table-catalog/${id}`, { isActive: !current }, authHeaders(token));
    fetchTables();
  };

  const handleCapacity = async (id, capacity) => {
    await api.put(`/table-catalog/${id}`, { capacity: Number(capacity) }, authHeaders(token));
    toast.success("Capacity updated.");
    fetchTables();
  };

  const handleRotateCode = async (id) => {
    const res = await api.put(`/table-catalog/${id}`, { rotateAccessCode: true }, authHeaders(token));
    setHighlightedTableId(id);
    toast.success(`Table ${res.data.tableNumber} new code: ${res.data.accessCode}`);
    fetchTables();
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-section-head">
        <div>
          <p className="eyebrow">Floor Control</p>
          <h1>Tables Management</h1>
          <p className="hint-text">Manage physical tables, guest capacity, and secure access codes used by diners.</p>
        </div>
      </div>

      <div className="panel admin-surface">
        <h2>Tables Management</h2>
        <form className="auth-form" onSubmit={handleAdd}>
          <input placeholder="Table Number" type="number" min="1" value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} required />
          <input placeholder="Capacity (persons)" type="number" min="1" max="20" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
          <button type="submit">Add Table</button>
        </form>
        <button className="secondary-btn" onClick={handleSeedDefaults}>Seed 8 Default Tables</button>
      </div>

      <div className="panel admin-surface">
        <h3>Configured Tables</h3>
        {loading ? <p>Loading...</p> : (
          <div className="admin-list">
            {tables.map((t) => (
              <div key={t._id} className={`admin-row ${highlightedTableId === t._id ? "table-code-highlight" : ""}`}>
                <div>
                  <strong>Table {t.tableNumber}</strong>
                  <p>{t.isActive ? "Available for assignment" : "Inactive"}</p>
                  <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>Access code: <strong>{t.accessCode}</strong></p>
                </div>
                <div className="row-actions">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    defaultValue={t.capacity}
                    onBlur={(e) => handleCapacity(t._id, e.target.value)}
                    style={{ width: 80 }}
                  />
                  <button className="small-btn" onClick={() => handleRotateCode(t._id)}>Rotate Code</button>
                  <button className="small-btn" onClick={() => handleToggle(t._id, t.isActive)}>{t.isActive ? "Disable" : "Enable"}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
