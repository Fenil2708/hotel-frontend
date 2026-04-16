import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, tableHeaders } from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tableSession, clearTableSession, setTableSession } = useAuth();
  const navigate = useNavigate();

  // Modal states
  const [showBillConfirmModal, setShowBillConfirmModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processingOnlinePayment, setProcessingOnlinePayment] = useState(false);
  const [verifyingOnlinePayment, setVerifyingOnlinePayment] = useState(false);
  const [cancelingOrderId, setCancelingOrderId] = useState("");
  const onlineConfirmRef = useRef(false);
  const location = useLocation();

  const fetchOrders = () => {
    if (!tableSession) return;
    api.get("/table/my-orders", tableHeaders(tableSession.token))
      .then(res => {
        setOrders(res.data);
        return api.get("/table/session", tableHeaders(tableSession.token)).catch(() => null);
      })
      .then((sessionRes) => {
        if (sessionRes?.data?.status && sessionRes.data.status !== tableSession.status) {
          setTableSession({ ...tableSession, status: sessionRes.data.status });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!tableSession) {
      navigate("/");
      return;
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [tableSession, navigate]);

  useEffect(() => {
    if (!tableSession) return;
    const params = new URLSearchParams(location.search);
    const stripeState = params.get("stripe");
    const stripeSessionId = params.get("session_id");

    if (stripeState === "cancel") {
      toast.error("Online payment was cancelled.");
      navigate("/orders", { replace: true });
      return;
    }

    if (stripeState !== "success" || !stripeSessionId || onlineConfirmRef.current) return;
    if (tableSession.status !== "awaiting_payment") {
      navigate("/orders", { replace: true });
      return;
    }

    onlineConfirmRef.current = true;
    setVerifyingOnlinePayment(true);
    let feedback = { rating: 0, review: "" };
    try {
      const raw = sessionStorage.getItem("pendingCheckoutFeedback");
      if (raw) feedback = JSON.parse(raw);
    } catch {
      feedback = { rating: 0, review: "" };
    }
    sessionStorage.removeItem("pendingCheckoutFeedback");

    api.post(
      "/table/stripe/confirm",
      { sessionId: stripeSessionId, rating: feedback.rating, review: feedback.review },
      tableHeaders(tableSession.token)
    )
      .then(() => {
        clearTableSession();
        toast.success("Online payment successful. Thank you for dining with us! 🎉");
        navigate("/", { replace: true });
      })
      .catch((err) => {
        onlineConfirmRef.current = false;
        toast.error(err.response?.data?.message || "Failed to verify online payment");
        navigate("/orders", { replace: true });
      })
      .finally(() => setVerifyingOnlinePayment(false));
  }, [location.search, tableSession, clearTableSession, navigate]);

  const handleRequestBill = async () => {
    try {
      await api.post("/table/request-bill", {}, tableHeaders(tableSession.token));
      setTableSession({ ...tableSession, status: "awaiting_payment" });
      setShowBillConfirmModal(false);
      toast.success("Final bill requested! Please hand cash to the staff. 💵");
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to request bill");
    }
  };

  const handleCompleteCheckout = async () => {
    try {
      if (paymentMethod === "online") {
        setProcessingOnlinePayment(true);
        sessionStorage.setItem("pendingCheckoutFeedback", JSON.stringify({ rating, review }));
        const res = await api.post(
          "/table/stripe/create-session",
          {},
          tableHeaders(tableSession.token)
        );
        if (!res.data?.url) {
          throw new Error("Stripe checkout URL not received.");
        }
        window.location.href = res.data.url;
        return;
      }

      await api.post("/table/complete-checkout", { rating, review, paymentMethod }, tableHeaders(tableSession.token));
      clearTableSession();
      setShowReviewModal(false);
      toast.success("Thank you for dining with us! 🎉");
      navigate("/");
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to complete checkout");
    } finally {
      setProcessingOnlinePayment(false);
    }
  };

  const handleCancelRequest = async (orderId) => {
    try {
      setCancelingOrderId(orderId);
      const res = await api.post(
        `/table/orders/${orderId}/cancel-request`,
        {},
        tableHeaders(tableSession.token)
      );
      toast.success(res.data.message || "Cancellation request sent.");
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send cancellation request.");
    } finally {
      setCancelingOrderId("");
    }
  };

  if (!tableSession) return null;
  if (verifyingOnlinePayment) return <div className="screen-loader">Verifying online payment...</div>;
  if (loading) return <div className="screen-loader">Loading orders...</div>;

  const billableOrders = orders.filter((order) => order.status !== "Cancelled");
  const totalBill = billableOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="orders-page-container">
      <div className="orders-header responsive-stack">
        <h2>Table {tableSession.tableNumber} - Kitchen Orders</h2>
        <div className="order-status-banner" style={{ background: tableSession.status === "open" ? "#dcfce7" : "#fef3c7", color: tableSession.status === "open" ? "#166534" : "#92400e", padding: "0.5rem 1rem", borderRadius: "20px", fontWeight: "600", fontSize: "0.9rem" }}>
          Status: {tableSession.status.replace("_", " ").toUpperCase()}
        </div>
      </div>

      {orders.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem 0" }}>No orders placed yet.</p>
      ) : (
        <div>
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-card-head">
                <span style={{ fontWeight: "600", color: "var(--text-secondary)" }}>{new Date(order.createdAt).toLocaleTimeString()}</span>
                <span style={{ fontWeight: "bold", color: order.status === "Pending" ? "#d97706" : order.status === "Cancelled" ? "#b91c1c" : "#059669" }}>{order.status}</span>
              </div>
              <div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-line-row">
                    <span>
                      {item.quantity}x {item.foodId?.name || "Deleted Item"}
                      {item.selectedVariant || item.selectedOption
                        ? ` (${[item.selectedVariant, item.selectedOption].filter(Boolean).join(" • ")})`
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
              {order.cancellationStatus === "requested" && (
                <div className="order-info-banner warning">
                  Cancellation request sent to staff. They will approve or reject it shortly.
                </div>
              )}
              {order.cancellationStatus === "rejected" && order.status !== "Cancelled" && (
                <div className="order-info-banner danger">
                  Staff rejected the cancellation request because preparation is already underway.
                </div>
              )}
              {order.status === "Cancelled" && (
                <div className="order-info-banner neutral">
                  This order has been cancelled and removed from the final bill.
                </div>
              )}
              <div style={{ textAlign: "right", marginTop: "1rem", fontWeight: "bold" }}>
                Subtotal: ₹{order.total}
              </div>
              {order.status !== "Served" && order.status !== "Cancelled" && tableSession.status !== "closed" && (
                <div className="order-card-actions">
                  <button
                    type="button"
                    className="secondary-btn order-cancel-btn"
                    disabled={cancelingOrderId === order._id || order.cancellationStatus === "requested"}
                    onClick={() => handleCancelRequest(order._id)}
                  >
                    {order.cancellationStatus === "requested"
                      ? "Cancellation Requested"
                      : cancelingOrderId === order._id
                        ? "Sending..."
                        : order.status === "Preparing"
                          ? "Request Cancel from Staff"
                          : "Cancel This Order"}
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="orders-total-bar">
            <h3>Final Total: <span style={{ color: "var(--primary-color)", fontSize: "1.5rem" }}>₹{totalBill}</span></h3>
          </div>
        </div>
      )}

      {billableOrders.length > 0 && tableSession.status === "open" && (
        <button 
          onClick={() => setShowBillConfirmModal(true)}
          style={{ width: "100%", marginTop: "2rem", padding: "1rem", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1.1rem", cursor: "pointer", transition: "0.3s" }}
        >
          Request Final Bill (Done Eating)
        </button>
      )}

      {tableSession.status === "awaiting_payment" && billableOrders.length > 0 && (
        <div style={{ marginTop: "2rem", background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💵</div>
          <h3 style={{ margin: "0 0 1rem 0", color: "#334155" }}>Awaiting Payment</h3>
          <p style={{ marginBottom: "1.5rem", color: "#64748b" }}>Please hand Cash to the staff. Afterwards, tell us about your experience!</p>
          <button 
            onClick={() => setShowReviewModal(true)}
            style={{ width: "100%", padding: "1rem", background: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1.1rem", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
          >
            Leave Feedback & Checkout
          </button>
        </div>
      )}

      {billableOrders.length === 0 && orders.length > 0 && (
        <div className="order-info-banner neutral">
          No billable orders are left for this table right now. You can place a fresh order from the menu.
        </div>
      )}

      {/* Bill Request Confirm Modal */}
      {showBillConfirmModal && (
        <div className="modal-overlay">
           <div className="modal-card">
              <h3 style={{ marginTop: 0 }}>Request Final Bill?</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>You won't be able to order more items after requesting the bill.</p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <button onClick={() => setShowBillConfirmModal(false)} style={{ padding: "0.75rem 1.5rem", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleRequestBill} style={{ padding: "0.75rem 1.5rem", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Yes, Request Bill</button>
              </div>
           </div>
        </div>
      )}

      {/* Rating & Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
           <div className="modal-card">
              <h2 style={{ marginTop: 0, color: "#1f2937" }}>How was your food? 😋</h2>
              <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "0.9rem" }}>Before you leave, we'd love to hear your feedback!</p>
              
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <span 
                    key={num} 
                    onClick={() => setRating(num)} 
                    style={{ fontSize: "2rem", cursor: "pointer", color: num <= rating ? "#fbbf24" : "#e5e7eb", transition: "0.2s" }}
                  >
                    ★
                  </span>
                ))}
              </div>

              <textarea 
                placeholder="Tell us what you loved (or didn't)..." 
                value={review}
                onChange={(e) => setReview(e.target.value)}
                style={{ width: "100%", minHeight: "100px", padding: "1rem", borderRadius: "8px", border: "1px solid #d1d5db", marginBottom: "1.5rem", fontFamily: "inherit", resize: "vertical" }}
              />
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginBottom: "1rem" }}>
                <option value="cash">Cash Payment</option>
                <option value="online">Online Payment</option>
              </select>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <button onClick={() => setShowReviewModal(false)} style={{ flex: 1, padding: "0.8rem", background: "#f3f4f6", color: "#4b5563", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Skip & Close</button>
                <button onClick={handleCompleteCheckout} disabled={processingOnlinePayment} style={{ flex: 2, padding: "0.8rem", background: "linear-gradient(to right, var(--primary-color), #f97316)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(249, 115, 22, 0.2)" }}>
                  {processingOnlinePayment ? "Redirecting to Stripe..." : "Submit Review"}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
