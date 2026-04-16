import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api } from "../api";

const STORAGE_KEY = "tableSession";

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

const TableSessionContext = createContext(null);

export function TableSessionProvider({ children }) {
  const [session, setSession] = useState(() => readStored());

  const setAndPersist = useCallback((next) => {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
    setSession(next);
  }, []);

  const startSession = useCallback(async (tableNumber, accessCode) => {
    const { data } = await api.post("/table/start", { tableNumber, accessCode });
    const next = {
      tableSessionToken: data.tableSessionToken,
      sessionId: data.sessionId,
      tableNumber: data.tableNumber,
      status: data.status,
    };
    setAndPersist(next);
    return next;
  }, [setAndPersist]);

  const refreshSession = useCallback(async () => {
    const snap = readStored();
    if (!snap?.tableSessionToken) return null;
    try {
      const { data } = await api.get("/table/session", {
        headers: { "X-Table-Session-Token": snap.tableSessionToken },
      });
      if (data.status === "closed") {
        setAndPersist(null);
        return null;
      }
      const next = { ...snap, status: data.status };
      setAndPersist(next);
      return next;
    } catch {
      setAndPersist(null);
      return null;
    }
  }, [setAndPersist]);

  const endSessionLocal = useCallback(() => {
    setAndPersist(null);
  }, [setAndPersist]);

  const tableHeaders = useMemo(() => {
    if (!session?.tableSessionToken) return {};
    return { "X-Table-Session-Token": session.tableSessionToken };
  }, [session]);

  const canOrder = Boolean(session?.tableSessionToken && session.status === "open");

  const value = useMemo(
    () => ({
      session,
      tableNumber: session?.tableNumber ?? null,
      status: session?.status ?? null,
      tableHeaders,
      canOrder,
      startSession,
      refreshSession,
      endSessionLocal,
      hasSession: Boolean(session?.tableSessionToken),
    }),
    [session, tableHeaders, canOrder, startSession, refreshSession, endSessionLocal]
  );

  return <TableSessionContext.Provider value={value}>{children}</TableSessionContext.Provider>;
}

export function useTableSession() {
  return useContext(TableSessionContext);
}
