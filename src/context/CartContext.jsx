import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("tableCart");
    if (!saved) return [];
    try {
      return JSON.parse(saved).map((item) => ({
        ...item,
        selectedVariant: item.selectedVariant || "",
        unitPrice: Number(item.unitPrice ?? item.price ?? 0),
        cartKey: item.cartKey || `${item._id}::${item.selectedVariant || ""}::${item.selectedOption || ""}`,
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("tableCart", JSON.stringify(cart));
  }, [cart]);

  const buildCartKey = (foodId, selectedVariant = "", selectedOption = "") => `${foodId}::${selectedVariant}::${selectedOption}`;

  const addToCart = (food, selection = {}) => {
    const selectedOption = selection.selectedOption || "";
    const selectedVariant = selection.selectedVariant || "";
    const unitPrice = Number(selection.unitPrice ?? food.price ?? 0);
    const cartKey = buildCartKey(food._id, selectedVariant, selectedOption);

    setCart((prev) => { 
      const existing = prev.find((item) => item.cartKey === cartKey);
      if (existing) {
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...food, quantity: 1, selectedOption, selectedVariant, price: unitPrice, unitPrice, cartKey }];
    });
  };

  const removeFromCart = (foodId, selectedVariant = "", selectedOption = "") => {
    const cartKey = buildCartKey(foodId, selectedVariant, selectedOption);
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const updateQuantity = (foodId, selectedVariant, selectedOption, quantity) => {
    if (quantity <= 0) {
      removeFromCart(foodId, selectedVariant, selectedOption);
      return;
    }
    const cartKey = buildCartKey(foodId, selectedVariant, selectedOption);
    setCart((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
