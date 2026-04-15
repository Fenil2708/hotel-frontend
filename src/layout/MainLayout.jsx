import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import NotificationBell from "../components/NotificationBell";

export default function MainLayout() {
  const { cart } = useCart();
  const { tableSession, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    toast.success("Logged out. See you again! 👋");
    logout();
  };

  const navLinkClass = (path) => `main-nav-link ${location.pathname === path ? "active" : ""}`;

  return (
    <main className="main-shell">
      <header className="main-header">
        <div className="main-header-inner">
          <Link to="/" className="main-brand-link">
            <h2>🍽️ Hotel Dine-In</h2>
          </Link>

          <nav className="desktop-nav">
            <Link to="/" className={navLinkClass("/")}>Table</Link>
            {tableSession && (
              <>
                <Link to="/menu" className={navLinkClass("/menu")}>Menu</Link>
                <Link to="/cart" className={navLinkClass("/cart")}>
                  Cart {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
                </Link>
                <Link to="/orders" className={navLinkClass("/orders")}>Orders</Link>
                <Link to="/profile" className={navLinkClass("/profile")}>Profile</Link>
              </>
            )}
            <div className="main-user-chip">
              {user?.avatar ? <img src={user.avatar} alt={user.name} className="top-avatar" /> : <div className="top-avatar">{(user?.name || "U")[0]}</div>}
              <span className="main-greeting">{user?.name}</span>
            </div>
            <NotificationBell />
            <button onClick={handleLogout} className="main-logout-btn">Logout</button>
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="hamburger-btn"
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-nav">
            <Link to="/" onClick={() => setMenuOpen(false)}>Table Setup</Link>
            {tableSession && (
              <>
                <Link to="/menu" onClick={() => setMenuOpen(false)}>Menu</Link>
                <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart ({cart.length})</Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)}>My Orders</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              </>
            )}
            <div className="mobile-nav-footer">
              <span>{user?.name}</span>
              <button onClick={handleLogout} className="main-logout-btn">Logout</button>
            </div>
          </div>
        )}
      </header>

      <Outlet />
    </main>
  );
}

