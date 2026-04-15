import { useEffect, useState } from "react";
import { api, authHeaders } from "../../api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [statsDate, setStatsDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirmSessionId, setConfirmSessionId] = useState("");
  const { token } = useAuth();

  const fetchData = () => {
    api.get(`/admin/dashboard?date=${statsDate}`, authHeaders(token))
       .then(res => setData(res.data))
       .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [statsDate]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus }, authHeaders(token));
      fetchData();
      toast.success(`Order marked as ${newStatus}`);
    } catch {
      toast.error("Error updating order status");
    }
  };

  const handleForceClose = async () => {
    if (!confirmSessionId) return;
    try {
      await api.post(`/admin/table-sessions/${confirmSessionId}/force-close`, {}, authHeaders(token));
      fetchData();
      setConfirmSessionId("");
      toast.success("Table cleared and bill saved ✅");
    } catch {
      toast.error("Error closing table");
    }
  };

  if(!data) return <div style={{ textAlign: "center", padding: "4rem" }}>Loading dashboard...</div>;

  const displayOrders = orderSearch.trim()
    ? data.kitchenOrders.filter(o =>
        String(o.tableNumber).includes(orderSearch) ||
        o.items.some(i => i.foodId?.name?.toLowerCase().includes(orderSearch.toLowerCase()))
      )
    : data.kitchenOrders;

  return (
    <div>
      {/* Header Stats */}
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Kitchen & Dining Stats</h1>
          <p className="hint-text">Showing stats for {data.stats.date}</p>
        </div>
        <input type="date" value={statsDate} onChange={(e) => setStatsDate(e.target.value)} />
        <div className="stats-row" style={{ display: "flex", gap: "2rem", background: "white", padding: "1rem 2rem", borderRadius: "12px", boxShadow: "var(--shadow-sm)", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Total Revenue</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>₹{data.stats.totalRevenue}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Completed Bills</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#3b82f6" }}>{data.stats.completedBills}</div>
          </div>
        </div>
      </div>

      <div className="admin-grid-2" style={{ gap: "2rem" }}>

        {/* Active Tables Column */}
        <div>
          <h2>Active Tables (Needs Payment / Running)</h2>
          {data.activeSessions.length === 0 && <p style={{ color: "var(--text-secondary)" }}>No active tables.</p>}
          {data.activeSessions.map(session => (
            <div key={session._id} style={{ background: "white", padding: "1.5rem", borderRadius: "12px", marginBottom: "1rem", boxShadow: "var(--shadow-sm)", borderLeft: session.status === "awaiting_payment" ? "4px solid #f59e0b" : "4px solid #10b981" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Table {session.tableNumber}</h3>
                <span style={{ padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold", background: session.status === "awaiting_payment" ? "#fef3c7" : "#dcfce7", color: session.status === "awaiting_payment" ? "#d97706" : "#059669" }}>
                  {session.status.toUpperCase().replace("_", " ")}
                </span>
              </div>

              {session.status === "awaiting_payment" && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "#fef3c7", borderRadius: "8px", color: "#92400e", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span>Table is awaiting bill payment (Cash)</span>
                  <button onClick={() => setConfirmSessionId(session._id)} style={{ padding: "0.5rem 1rem", background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Mark Paid & Clear Table</button>
                </div>
              )}
              {session.status === "open" && (
                <div style={{ marginTop: "1rem" }}>
                  <button onClick={() => setConfirmSessionId(session._id)} style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>Force Clear Table</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Kitchen Orders Column */}
        <div>
          {/* Search header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Kitchen Orders (Live)</h2>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.9rem" }}>🔍</span>
              <input
                type="text"
                placeholder="Search by table or item..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                style={{ padding: "0.5rem 1.5rem 0.5rem 2rem", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "0.85rem", outline: "none", width: "220px" }}
                onFocus={e => e.target.style.borderColor = "var(--primary-color)"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
              {orderSearch && (
                <button onClick={() => setOrderSearch("")} style={{ position: "absolute", right: "0.4rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>✕</button>
              )}
            </div>
          </div>

          {/* Orders list */}
          {displayOrders.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>
              {orderSearch ? `No orders matching "${orderSearch}"` : "No active kitchen orders."}
            </p>
          ) : displayOrders.map(order => (
            <div key={order._id} style={{ background: "white", padding: "1.5rem", borderRadius: "12px", marginBottom: "1rem", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>Table {order.tableNumber}</h3>
                <span style={{ fontWeight: "bold", color: order.status === "Pending" ? "#ef4444" : "#f59e0b" }}>{order.status}</span>
              </div>

              <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px" }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", margin: "0.5rem 0", fontWeight: "500" }}>
                    <span>{item.quantity}x {item.foodId?.name || "Unknown"}</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                      [{item.foodId?.category?.name || "No Cat"}] {item.selectedOption ? `(${item.selectedOption})` : ""}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {order.status === "Pending" && (
                  <button onClick={() => handleUpdateStatus(order._id, "Preparing")} style={{ flex: 1, padding: "0.75rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Accept / Prepare</button>
                )}
                {order.status === "Preparing" && (
                  <button onClick={() => handleUpdateStatus(order._id, "Served")} style={{ flex: 1, padding: "0.75rem", background: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Mark Served</button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {confirmSessionId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ marginTop: 0 }}>Clear this table?</h3>
            <p className="hint-text">This will mark the table as available for next customer.</p>
            <div style={{ display: "flex", gap: "0.8rem", marginTop: "1rem" }} className="confirm-actions">
              <button className="confirm-cancel-btn" onClick={() => setConfirmSessionId("")}>Cancel</button>
              <button className="confirm-ok-btn" onClick={handleForceClose}>Yes, Clear Table</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
