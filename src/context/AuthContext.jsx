import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => JSON.parse(localStorage.getItem("auth") || "null"));
  const [tableSession, setTableSessionState] = useState(() => JSON.parse(localStorage.getItem("tableSession") || "null"));

  const login = (payload) => {
    setAuth(payload);
    localStorage.setItem("auth", JSON.stringify(payload));
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
  };

  const setTableSession = (payload) => {
      setTableSessionState(payload);
      if (payload) {
          localStorage.setItem("tableSession", JSON.stringify(payload));
      } else {
          localStorage.removeItem("tableSession");
      }
  };

  const clearTableSession = () => setTableSession(null);

  const value = useMemo(
    () => ({
      auth,
      token: auth?.token || "",
      user: auth?.user || null,
      isLoggedIn: Boolean(auth?.token),
      isAdmin: auth?.user?.role === "admin",
      login,
      logout,
      tableSession,
      setTableSession,
      clearTableSession
    }),
    [auth, tableSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
