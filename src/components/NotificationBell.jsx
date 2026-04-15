import { useEffect, useMemo, useState } from "react";
import { api, authHeaders } from "../api";
import { useAuth } from "../context/AuthContext";

export default function NotificationBell() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const fetchNotifications = async () => {
    if (!token) return;
    try { 
      const res = await api.get("/notifications", authHeaders(token));
      setItems(res.data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const markAllRead = async () => {
    await api.patch("/notifications/mark-all-read", {}, authHeaders(token));
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteOne = async (id) => {
    await api.delete(`/notifications/${id}`, authHeaders(token));
    setItems((prev) => prev.filter((n) => n._id !== id));
  };

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`, {}, authHeaders(token));
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const fmt = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="notif-wrap">
      <button className="notif-btn" onClick={() => setOpen((s) => !s)} aria-label="Notifications">
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <strong>Notifications</strong>
            <button onClick={markAllRead} className="notif-link-btn">Mark all read</button>
          </div>
          <div className="notif-list">
            {items.length === 0 && <p className="hint-text">No notifications</p>}
            {items.map((n) => (
              <div key={n._id} className={`notif-item ${n.isRead ? "read" : "unread"}`} onClick={() => markRead(n._id)}>
                <div className="notif-content">
                  <p className="notif-title">{n.title}</p>
                  <p className="notif-msg">{n.message}</p>
                  <p className="notif-time">{fmt(n.createdAt)}</p>
                </div>
                <button className="notif-del-btn" onClick={(e) => { e.stopPropagation(); deleteOne(n._id); }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
