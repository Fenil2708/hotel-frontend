import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import NotificationBell from "../components/NotificationBell";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 901);
  const isDesktop = window.innerWidth >= 901;

  const activePath = useMemo(() => {
    if (location.pathname === "/admin") return "/admin";
    if (location.pathname.startsWith("/admin/menu-management")) return "/admin/menu-management";
    if (location.pathname.startsWith("/admin/menu")) return "/admin/menu";
    if (location.pathname.startsWith("/admin/profit")) return "/admin/profit";
    if (location.pathname.startsWith("/admin/tables")) return "/admin/tables";
    if (location.pathname.startsWith("/admin/users")) return "/admin/users";
    if (location.pathname.startsWith("/admin/profile")) return "/admin/profile";
    return "";
  }, [location.pathname]);

  const navStyle = (path) => ({
    color: activePath === path ? "#ffffff" : "#9ca3af",
    textDecoration: "none",
    fontWeight: "bold",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    background: activePath === path ? "linear-gradient(135deg, var(--primary-color), #f97316)" : "transparent",
    display: "block",
    transition: "all 0.2s",
    boxShadow: activePath === path ? "0 2px 8px rgba(249,115,22,0.3)" : "none",
  });

  const handleLogout = () => {
    toast.success("Successfully logged out");
    logout();
  };

  useEffect(() => {
    const onResize = () => {
      setSidebarOpen(window.innerWidth >= 901);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="admin-shell">
      {!sidebarOpen && !isDesktop && (
        <button className="admin-left-menu-fab" onClick={() => setSidebarOpen(true)}>
          ☰ Menu
        </button>
      )}

      {/* Sidebar overlay backdrop on mobile */}
      {sidebarOpen && !isDesktop && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      {sidebarOpen && (
        <aside className={`admin-aside ${isDesktop ? "desktop-open" : "mobile-open"}`}>
          <div className="admin-aside-head">
            <h2>👨‍🍳 Admin Panel</h2>
            {!isDesktop && <button onClick={() => setSidebarOpen(false)} className="admin-close-btn">&times;</button>}
          </div>
          
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
            <Link to="/admin" style={navStyle("/admin")}>📊 Dashboard Overview</Link>
            <Link to="/admin/menu" style={navStyle("/admin/menu")}>➕ Add Menu Item</Link>
            <Link to="/admin/menu-management" style={navStyle("/admin/menu-management")}>🍔 Menu Management</Link>
            <Link to="/admin/profit" style={navStyle("/admin/profit")}>💰 Profit</Link>
            <Link to="/admin/tables" style={navStyle("/admin/tables")}>🪑 Tables</Link>
            <Link to="/admin/users" style={navStyle("/admin/users")}>👥 Customer History</Link>
            <Link to="/admin/profile" style={navStyle("/admin/profile")}>⚙️ Profile Settings</Link>
          </nav>

          <div className="admin-aside-foot">
            <button onClick={handleLogout} className="admin-logout-btn">
              🚪 Logout
            </button>
          </div>
        </aside>
      )}

      <main className="admin-main-content">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            {!isDesktop && <button className="admin-topbar-menu-btn" onClick={() => setSidebarOpen(true)}>☰ Menu</button>}
            <h3>Hotel Dine-In Admin</h3>
          </div>
          <div className="admin-profile-chip">
            {user?.avatar ? <img src={user.avatar} alt={user.name} className="top-avatar" /> : <div className="top-avatar">{(user?.name || "A")[0]}</div>}
            <div>
              <p>{user?.name || "Admin"}</p>
              <span>{user?.email || ""}</span>
            </div>
          </div>
          <NotificationBell />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
