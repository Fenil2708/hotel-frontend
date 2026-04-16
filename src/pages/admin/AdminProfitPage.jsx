import { useEffect, useState } from "react";
import { api, authHeaders } from "../../api";
import { useAuth } from "../../context/AuthContext";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminProfitPage() {
  const { token } = useAuth();
  const [from, setFrom] = useState(todayString());
  const [to, setTo] = useState(todayString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfit = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/profit?from=${from}&to=${to}`, authHeaders(token));
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfit();
  }, []);

  return (
    <div className="admin-page-shell">
      <div className="admin-section-head">
        <div>
          <p className="eyebrow">Finance Overview</p>
          <h1>Profit Analytics</h1>
          <p className="hint-text">Track revenue quality, payment mix, and bill activity across your chosen range.</p>
        </div>
      </div>
      <div className="admin-filter-bar">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="small-btn" onClick={fetchProfit}>Apply</button>
      </div>

      {loading ? <p>Loading...</p> : data && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><p>Total Revenue</p><strong>Rs. {data.summary.totalRevenue || 0}</strong></div>
            <div className="stat-card"><p>Cash Revenue</p><strong>Rs. {data.summary.cashRevenue || 0}</strong></div>
            <div className="stat-card"><p>Online Revenue</p><strong>Rs. {data.summary.onlineRevenue || 0}</strong></div>
            <div className="stat-card"><p>Total Bills</p><strong>{data.summary.bills || 0}</strong></div>
          </div>
          <div className="panel admin-surface">
            <h3>Date-wise Income</h3>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Cash</th>
                    <th>Online</th>
                    <th>Bills</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((row) => (
                    <tr key={row._id}>
                      <td>{row._id}</td>
                      <td>Rs. {row.total}</td>
                      <td>Rs. {row.cash}</td>
                      <td>Rs. {row.online}</td>
                      <td>{row.bills}</td>
                    </tr>
                  ))}
                  {data.daily.length === 0 && (
                    <tr><td colSpan="5">No income data in this date range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
