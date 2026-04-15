import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, tableHeaders } from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function TableEntryPage() {
  const [tableNumber, setTableNumber] = useState("");
  const [guests, setGuests] = useState(2);
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTableSession, clearTableSession, tableSession, auth } = useAuth();

  const handleStart = async (e) => {
    e.preventDefault();
    if (!tableNumber) return;
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/table/start", { 
        tableNumber: Number(tableNumber),
        guests: Number(guests),
        customerId: auth?.user?.id 
      });
      setTableSession({
        sessionId: res.data.sessionId,
        token: res.data.tableSessionToken,
        tableNumber: res.data.tableNumber,
        guests: res.data.guests,
        status: res.data.status,
      });
      toast.success(`Welcome! Started dining at Table ${res.data.tableNumber} 🍽️`);
      navigate("/menu");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async (count) => {
    setLoadingTables(true);
    try {
      const res = await api.get(`/table/available?guests=${count}`);
      setTables(res.data);
      if (res.data.length > 0) {
        const firstAvailable = res.data.find((t) => t.selectable);
        setTableNumber(firstAvailable ? String(firstAvailable.tableNumber) : "");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tables.");
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    const checkAndLoad = async () => {
      if (tableSession?.token) {
        try {
          const res = await api.get("/table/session", tableHeaders(tableSession.token));
          const nextPath = res.data.status === "awaiting_payment" ? "/orders" : "/menu";
          navigate(nextPath, { replace: true });
          return;
        } catch {
          clearTableSession();
        }
      }
      fetchTables(guests);
    };
    checkAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="table-entry-wrap">
      <div className="table-entry-container">
      <h1>Welcome to Hotel Dine-In</h1>
      <p className="table-entry-subtext">Select guest count and choose an available table.</p>

      {error && <div className="table-error">{error}</div>}

      <form onSubmit={handleStart}>
        <div className="table-input-wrap">
          <label>How many guests?</label>
          <input
            type="number"
            min="1"
            max="20"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="table-number-input"
            required
          />
          <button type="button" className="secondary-btn" onClick={() => fetchTables(guests)} disabled={loadingTables}>
            {loadingTables ? "Checking..." : "Show Available Tables"}
          </button>
        </div>
        <div className="table-input-wrap">
          <label>Select Table</label>
          <select value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} required>
            <option value="">Choose table</option>
            {tables.map((t) => (
              <option key={t.tableNumber} value={t.tableNumber} disabled={!t.selectable}>
                Table {t.tableNumber} ({t.capacity} seats) {t.occupied ? "- Occupied" : t.canSeatGuests ? "- Available" : "- Small"}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="table-start-btn">
          {loading ? "Starting..." : "Start Dining"}
        </button>
      </form>
    </div>
    </div>
  );
}
