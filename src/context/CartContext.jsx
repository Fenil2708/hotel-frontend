import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("tableCart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("tableCart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (food, selectedOption = "") => {
    setCart((prev) => { 
      // Find if same food AND same option exists
      const existing = prev.find((item) => item._id === food._id && item.selectedOption === selectedOption);
      if (existing) {
        return prev.map((item) =>
          item._id === food._id && item.selectedOption === selectedOption
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...food, quantity: 1, selectedOption }];
    });
  };

  const removeFromCart = (foodId, selectedOption = "") => {
    setCart((prev) => prev.filter((item) => !(item._id === foodId && item.selectedOption === selectedOption)));
  };

  const updateQuantity = (foodId, selectedOption, quantity) => {
    if (quantity <= 0) {
      removeFromCart(foodId, selectedOption);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item._id === foodId && item.selectedOption === selectedOption
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
