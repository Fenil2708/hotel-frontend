import { useState, useEffect } from "react";
import { api, authHeaders } from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const [userSearch, setUserSearch] = useState("");
  
  // Modal for History
  const [selectedUser, setSelectedUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users", authHeaders(token));
      setUsers(res.data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async (u) => {
    setSelectedUser(u);
    setHistoryLoading(true);
    setHistory([]);
    try {
      const res = await api.get(`/admin/users/${u._id}/history`, authHeaders(token));
      setHistory(res.data);
    } catch(err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const filteredUsers = userSearch.trim()
    ? users.filter(u =>
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.mobile?.includes(userSearch)
      )
    : users;

  return (
    <div className="admin-page-shell">
      <div className="admin-section-head responsive-stack">
        <div>
          <p className="eyebrow">Guest Relationships</p>
          <h1 style={{ margin: 0 }}>Customer Users Directory</h1>
          <p className="hint-text">Review customer details, revisit dining history, and identify your most loyal guests.</p>
        </div>
        <div style={{ position: "relative", width: "280px" }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, mobile..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            style={{ width: "100%", padding: "0.65rem 2rem 0.65rem 2.2rem", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "0.9rem", outline: "none" }}
            onFocus={e => e.target.style.borderColor = "var(--primary-color)"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
          {userSearch && (
            <button onClick={() => setUserSearch("")} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>✕</button>
          )}
        </div>
      </div>
      
      <div className="panel admin-surface">
        <div className="responsive-table">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
              <th style={{ padding: "1rem", borderBottom: "2px solid #ccc" }}>Name</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid #ccc" }}>Mobile</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid #ccc" }}>Email</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid #ccc" }}>Joined On</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid #ccc" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr><td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No customers found{userSearch ? ` for "${userSearch}"` : ""}.</td></tr>
            )}
            {filteredUsers.map(u => (
              <tr key={u._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {u.avatar ? <img src={u.avatar} width="30" height="30" style={{ borderRadius: "50%", objectFit: "cover" }} /> : "👤"}
                    {u.name}
                  </div>
                </td>
                <td style={{ padding: "1rem" }}>{u.mobile || "N/A"}</td>
                <td style={{ padding: "1rem" }}>{u.email}</td>
                <td style={{ padding: "1rem" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "1rem" }}>
                  <button onClick={() => openHistory(u)} style={{ padding: "0.5rem 1rem", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                    View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* History Modal */}
      {selectedUser && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "2rem" }}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0 }}>Order History: {selectedUser.name}</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>
            
            {historyLoading ? <p>Loading history...</p> : (
              history.length === 0 ? <p>No completed orders found for this user.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {history.map(bill => (
                    <div key={bill._id} style={{ border: "1px solid #ccc", padding: "1.5rem", borderRadius: "8px", background: "#f9fafb" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem" }}>
                        <div>
                          <strong>Date:</strong> {new Date(bill.createdAt).toLocaleDateString()} at {new Date(bill.createdAt).toLocaleTimeString()}
                        </div>
                        <div style={{ fontWeight: "bold", color: "var(--primary-color)" }}>
                          Total: ₹{bill.total}
                        </div>
                      </div>

                      {bill.rating > 0 && (
                        <div style={{ marginBottom: "1rem", background: "#fffbeb", padding: "1rem", borderRadius: "8px", border: "1px solid #fde68a" }}>
                          <div style={{ display: "flex", gap: "0.25rem", color: "#fbbf24", fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{i < bill.rating ? "★" : "☆"}</span>
                            ))}
                          </div>
                          {bill.review && <p style={{ margin: 0, color: "#92400e", fontStyle: "italic", fontSize: "0.9rem" }}>"{bill.review}"</p>}
                        </div>
                      )}

                      <div>
                        {bill.items.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", margin: "0.25rem 0", fontSize: "0.9rem" }}>
                            <span>{item.quantity}x {item.name} {[item.selectedVariant, item.selectedOption].filter(Boolean).length ? `(${[item.selectedVariant, item.selectedOption].filter(Boolean).join(" • ")})` : ""}</span>
                            <span>₹{item.lineTotal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
