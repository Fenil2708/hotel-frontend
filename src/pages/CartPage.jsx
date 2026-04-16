import { useNavigate } from "react-router-dom";
import { api, tableHeaders } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { tableSession } = useAuth();
  const navigate = useNavigate();

  if (!tableSession) {
    navigate("/");
    return null;
  }

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    try {
      await api.post("/table/order", {
        items: cart.map(item => ({
          foodId: item._id,
          quantity: item.quantity,
          selectedOption: item.selectedOption,
          selectedVariant: item.selectedVariant,
          unitPrice: item.unitPrice || item.price,
        })),
        total: cartTotal
      }, tableHeaders(tableSession.token));

      clearCart();
      toast.success("Order sent to kitchen! 🍳");
      navigate("/orders");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order.");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some delicious items from the menu!</p>
        <button onClick={() => navigate("/menu")} className="primary-btn">
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h2>Table {tableSession.tableNumber} - Order Summary</h2>
      
      <div style={{ marginTop: "2rem" }}>
        {cart.map((item, index) => (
          <div key={`${item._id}-${index}`} className="cart-item-row">
            <div className="cart-item-main">
              <img src={item.image} alt={item.name} />
              <div>
                <h4 className="cart-item-title">{item.name}</h4>
                <div className="cart-item-meta">
                  {[item.selectedVariant, item.selectedOption].filter(Boolean).join(" • ") || "Standard"}
                </div>
                <div style={{ color: "var(--text-secondary)" }}>₹{item.price}</div>
              </div>
            </div>
            
            <div className="cart-item-actions">
              <div className="cart-qty-box">
                <button onClick={() => updateQuantity(item._id, item.selectedVariant, item.selectedOption, item.quantity - 1)}>-</button>
                <span style={{ width: "20px", textAlign: "center", fontWeight: "600" }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, item.selectedVariant, item.selectedOption, item.quantity + 1)}>+</button>
              </div>
              <div style={{ width: "60px", textAlign: "right", fontWeight: "600" }}>₹{item.price * item.quantity}</div>
              <button onClick={() => removeFromCart(item._id, item.selectedVariant, item.selectedOption)} style={{ color: "red", border: "none", background: "none", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-total-bar">
        <h3 style={{ margin: 0 }}>Total</h3>
        <h3 style={{ margin: 0 }}>₹{cartTotal}</h3>
      </div>

      <button onClick={handleSendToKitchen} className="checkout-btn">
        Send Order to Kitchen
      </button>
    </div>
  );
}
