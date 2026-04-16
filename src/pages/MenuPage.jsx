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
  const [selectedVariant, setSelectedVariant] = useState("");

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
    const defaultVariant = food.variants?.find((variant) => variant.isDefault) || food.variants?.[0];
    if ((food.options && food.options.length > 0) || (food.variants && food.variants.length > 0)) {
      setCurrentFood(food);
      setSelectedOption(food.options?.[0] || "");
      setSelectedVariant(defaultVariant?.name || "");
      setOptionModalOpen(true);
    } else {
      addToCart(food, { selectedOption: "", selectedVariant: "", unitPrice: food.price });
      toast.success(`Added ${food.name} to cart!`);
      if (isLoggedIn) {
        api.post("/notifications", { title: "Cart Updated", message: `Added ${food.name} to cart.`, type: "cart" }, authHeaders(token)).catch(() => {});
      }
    }
  };

  const confirmAddWithOption = () => {
    if (currentFood) {
      const activeVariant = currentFood.variants?.find((variant) => variant.name === selectedVariant);
      addToCart(currentFood, {
        selectedOption,
        selectedVariant,
        unitPrice: activeVariant?.price ?? currentFood.price,
      });
      const selectionText = [selectedVariant, selectedOption].filter(Boolean).join(" • ");
      toast.success(`Added ${currentFood.name}${selectionText ? ` (${selectionText})` : ""} to cart!`);
      if (isLoggedIn) {
        api.post("/notifications", { title: "Cart Updated", message: `Added ${currentFood.name}${selectionText ? ` (${selectionText})` : ""} to cart.`, type: "cart" }, authHeaders(token)).catch(() => {});
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
      <div className="menu-hero">
        <div className="menu-hero-copy">
          <p className="eyebrow">Curated Dining</p>
          <h1>Hotel Menu <span>Table {tableSession?.tableNumber}</span></h1>
          <p className="menu-hero-subtext">Chef-crafted dishes, elegant service, and a calmer ordering experience at your table.</p>
        </div>
        <div className="menu-hero-badge">
          <strong>{filteredFoods.length}</strong>
          <span>plates ready to order</span>
        </div>
      </div>

      <div className="menu-toolbar-card">
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
      </div>
      
      {searchQuery && (
        <div className="menu-result-meta">
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
                <span style={{ fontWeight: "700", color: "var(--primary-color)", marginLeft: "0.5rem", whiteSpace: "nowrap" }}>
                  ₹{food.variants?.length ? Math.min(...food.variants.map((variant) => variant.price)) : food.price}
                </span>
              </div>
              {food.variants?.length > 0 && (
                <div className="food-variant-preview">
                  {food.variants.map((variant) => (
                    <span key={variant.name} className="variant-chip">{variant.name} • ₹{variant.price}</span>
                  ))}
                </div>
              )}
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem", flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{food.description}</p>
              <button onClick={() => handleAddToCartClick(food)} className="food-add-btn">
                {food.options?.length > 0 || food.variants?.length > 0 ? "Customize & Add" : "Add to Cart"}
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
          {currentFood.variants?.length > 0 && (
            <>
              <p className="option-modal-subtitle">Select portion / style</p>
              <div className="option-list">
                {currentFood.variants.map((variant) => (
                  <label key={variant.name} className={`option-item ${selectedVariant === variant.name ? "active" : ""}`}>
                    <input type="radio" name="foodVariant" value={variant.name} checked={selectedVariant === variant.name} onChange={() => setSelectedVariant(variant.name)} />
                    <span className="option-text">{variant.name}</span>
                    <strong>₹{variant.price}</strong>
                  </label>
                ))}
              </div>
            </>
          )}
          {currentFood.options?.length > 0 && (
            <>
          <div className="option-list">
            {currentFood.options.map(opt => (
              <label key={opt} className={`option-item ${selectedOption === opt ? "active" : ""}`}>
                <input type="radio" name="foodOption" value={opt} checked={selectedOption === opt} onChange={() => setSelectedOption(opt)} />
                <span className="option-text">{opt}</span>
              </label>
            ))}
          </div>
            </>
          )}
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
