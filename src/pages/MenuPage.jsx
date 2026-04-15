import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function MenuPage() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { tableSession, token, isLoggedIn } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Modal State for Options
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [currentFood, setCurrentFood] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => {
    if (!optionModalOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [optionModalOpen]);

  useEffect(() => {
    if (!tableSession) {
      navigate("/");
      return;
    }
    Promise.all([api.get("/foods"), api.get("/categories")])
      .then(([fRes, cRes]) => {
        setFoods(fRes.data);
        setCategories(cRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [tableSession, navigate]);

  const handleAddToCartClick = (food) => {
    if (food.options && food.options.length > 0) {
      setCurrentFood(food);
      setSelectedOption(food.options[0]); // default first
      setOptionModalOpen(true);
    } else {
      addToCart(food, "");
      toast.success(`Added ${food.name} to cart!`);
      if (isLoggedIn) {
        api.post("/notifications", { title: "Cart Updated", message: `Added ${food.name} to cart.`, type: "cart" }, authHeaders(token)).catch(() => {});
      }
    }
  };

  const confirmAddWithOption = () => {
    if (currentFood) {
      addToCart(currentFood, selectedOption);
      toast.success(`Added ${currentFood.name} (${selectedOption}) to cart!`);
      if (isLoggedIn) {
        api.post("/notifications", { title: "Cart Updated", message: `Added ${currentFood.name} (${selectedOption}) to cart.`, type: "cart" }, authHeaders(token)).catch(() => {});
      }
      setOptionModalOpen(false);
      setCurrentFood(null);
    }
  };

  if (loading) return <div className="screen-loader">Loading Menu...</div>;

  const catFiltered = selectedCat === "All" ? foods : foods.filter(f => f.category?.name === selectedCat);
  const filteredFoods = searchQuery.trim()
    ? catFiltered.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : catFiltered;

  return (
    <>
    <div className="menu-page">
      <div className="menu-page-head">
        <h1>Hotel Menu <span>Table {tableSession?.tableNumber}</span></h1>
      </div>

      {/* Search Bar */}
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search dishes by name or description..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="menu-search-input"
          onFocus={e => e.target.style.borderColor = "var(--primary-color)"}
          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="search-clear-btn">✕</button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="category-scroll">
        <button
          onClick={() => setSelectedCat("All")}
          style={{ 
            padding: "0.5rem 1.5rem", borderRadius: "20px", border: "none", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap",
            background: selectedCat === "All" ? "var(--primary-color)" : "#e5e7eb",
            color: selectedCat === "All" ? "white" : "black"
          }}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c._id}
            onClick={() => setSelectedCat(c.name)}
            style={{ 
              padding: "0.5rem 1.5rem", borderRadius: "20px", border: "none", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap",
              background: selectedCat === c.name ? "var(--primary-color)" : "#e5e7eb",
              color: selectedCat === c.name ? "white" : "black"
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
      
      {/* Results count */}
      {searchQuery && (
        <div style={{ marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          {filteredFoods.length === 0 ? `No results for "${searchQuery}"` : `${filteredFoods.length} result${filteredFoods.length !== 1 ? "s" : ""} for "${searchQuery}"`}
        </div>
      )}

      <div className="foods-grid">
        {filteredFoods.map((food) => (
          <div key={food._id} className="food-card">
            <img src={food.image} alt={food.name} className="food-card-image" />
            <div className="food-card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", flex: 1 }}>{food.name}</h3>
                <span style={{ fontWeight: "700", color: "var(--primary-color)", marginLeft: "0.5rem", whiteSpace: "nowrap" }}>₹{food.price}</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem", flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{food.description}</p>
              <button onClick={() => handleAddToCartClick(food)} className="food-add-btn">
                {food.options?.length > 0 ? "Add (Select Option)" : "Add to Cart"}
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
    {optionModalOpen && currentFood && (
      <div className="modal-overlay" onClick={() => setOptionModalOpen(false)}>
        <div className="modal-card option-modal-card" onClick={(e) => e.stopPropagation()}>
          <h3 className="option-modal-title">Choose your preference</h3>
          <p className="option-modal-subtitle">{currentFood.name}</p>
          <div className="option-list">
            {currentFood.options.map(opt => (
              <label key={opt} className={`option-item ${selectedOption === opt ? "active" : ""}`}>
                <input type="radio" name="foodOption" value={opt} checked={selectedOption === opt} onChange={() => setSelectedOption(opt)} />
                <span className="option-text">{opt}</span>
              </label>
            ))}
          </div>
          <div className="option-actions">
            <button onClick={() => setOptionModalOpen(false)} className="option-cancel-btn">Cancel</button>
            <button onClick={confirmAddWithOption} className="option-confirm-btn">Add to Cart</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
