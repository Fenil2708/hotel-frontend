import { useEffect, useState } from "react";
import { api, authHeaders } from "../../api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [statsDate, setStatsDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirmSessionId, setConfirmSessionId] = useState("");
  const [rotatedCodeInfo, setRotatedCodeInfo] = useState(null);
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

  const handleCancellationDecision = async (orderId, decision) => {
    try {
      await api.patch(`/admin/orders/${orderId}/cancellation`, { decision }, authHeaders(token));
      fetchData();
      toast.success(decision === "approve" ? "Cancellation approved" : "Cancellation rejected");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to review cancellation request");
    }
  };

  const handleForceClose = async () => {
    if (!confirmSessionId) return;
    try {
      const res = await api.post(`/admin/table-sessions/${confirmSessionId}/force-close`, {}, authHeaders(token));
      fetchData();
      setConfirmSessionId("");
      if (res.data?.rotatedTable?.tableNumber) {
        setRotatedCodeInfo(res.data.rotatedTable);
        toast.success(`Table ${res.data.rotatedTable.tableNumber} cleared. New code: ${res.data.rotatedTable.accessCode}`);
      } else {
        toast.success("Table cleared and bill saved ✅");
      }
    } catch {
      toast.error("Error closing table");
    }
  };

  if(!data) return <div style={{ textAlign: "center", padding: "4rem" }}>Loading dashboard...</div>;

  const pendingCount = data.kitchenOrders.filter((order) => order.status === "Pending").length;
  const preparingCount = data.kitchenOrders.filter((order) => order.status === "Preparing").length;
  const cancellationCount = data.kitchenOrders.filter((order) => order.cancellationStatus === "requested").length;

  const displayOrders = orderSearch.trim()
    ? data.kitchenOrders.filter(o =>
        String(o.tableNumber).includes(orderSearch) ||
        o.items.some(i => i.foodId?.name?.toLowerCase().includes(orderSearch.toLowerCase()))
      )
    : data.kitchenOrders;

  return (
    <div className="dashboard-page">
      {/* Header Stats */}
      <div className="dashboard-header dashboard-header-grid">
        <div>
          <p className="eyebrow">Dining Nerve Center</p>
          <h1>Kitchen & Dining Stats</h1>
          <p className="hint-text">Showing stats for {data.stats.date}</p>
        </div>
        <input className="dashboard-date-input" type="date" value={statsDate} onChange={(e) => setStatsDate(e.target.value)} />
        <div className="stats-row dashboard-stats-card">
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

      <div className="dashboard-kpi-strip">
        <div className="dashboard-kpi-card">
          <span>Active Tables</span>
          <strong>{data.activeSessions.length}</strong>
          <small>currently seated</small>
        </div>
        <div className="dashboard-kpi-card">
          <span>Pending Orders</span>
          <strong>{pendingCount}</strong>
          <small>awaiting kitchen action</small>
        </div>
        <div className="dashboard-kpi-card">
          <span>Preparing</span>
          <strong>{preparingCount}</strong>
          <small>being finished now</small>
        </div>
        <div className="dashboard-kpi-card">
          <span>Cancel Requests</span>
          <strong>{cancellationCount}</strong>
          <small>need staff review</small>
        </div>
      </div>

      {rotatedCodeInfo && (
        <div className="order-info-banner neutral">
          New access code generated for Table {rotatedCodeInfo.tableNumber}: <strong>{rotatedCodeInfo.accessCode}</strong>
        </div>
      )}

      <div className="admin-grid-2 dashboard-grid" style={{ gap: "2rem" }}>

        {/* Active Tables Column */}
        <div>
          <h2>Active Tables (Needs Payment / Running)</h2>
          {data.activeSessions.length === 0 && <p style={{ color: "var(--text-secondary)" }}>No active tables.</p>}
          {data.activeSessions.map(session => (
            <div key={session._id} className="dashboard-card" style={{ borderLeft: session.status === "awaiting_payment" ? "4px solid #f59e0b" : "4px solid #10b981" }}>
              <div className="responsive-stack">
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
          <div className="responsive-stack" style={{ marginBottom: "1rem", gap: "1rem" }}>
            <h2 style={{ margin: 0 }}>Kitchen Orders (Live)</h2>
            <div className="dashboard-search-wrap">
              <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.9rem" }}>🔍</span>
              <input
                type="text"
                placeholder="Search by table or item..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="dashboard-search-input"
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
            <div key={order._id} className="dashboard-card">
              <div className="responsive-stack" style={{ marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>Table {order.tableNumber}</h3>
                <span style={{ fontWeight: "bold", color: order.status === "Pending" ? "#ef4444" : "#f59e0b" }}>{order.status}</span>
              </div>

              <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px" }}>
                {order.items.map((item, idx) => (
                  <div key={idx} className="admin-order-row">
                    <span>{item.quantity}x {item.foodId?.name || "Unknown"}</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                      [{item.foodId?.category?.name || "No Cat"}] {[item.selectedVariant, item.selectedOption].filter(Boolean).join(" • ") || "Standard"}
                    </span>
                  </div>
                ))}
              </div>

              {order.cancellationStatus === "requested" && (
                <div className="order-info-banner warning" style={{ marginBottom: "1rem" }}>
                  Customer requested cancellation{order.cancellationReason ? `: ${order.cancellationReason}` : ""}.
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {order.cancellationStatus === "requested" && (
                  <>
                    <button onClick={() => handleCancellationDecision(order._id, "approve")} style={{ flex: 1, padding: "0.75rem", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Approve Cancel</button>
                    <button onClick={() => handleCancellationDecision(order._id, "reject")} style={{ flex: 1, padding: "0.75rem", background: "#64748b", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Reject Cancel</button>
                  </>
                )}
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
