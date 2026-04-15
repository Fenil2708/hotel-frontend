import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
});

export const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const tableHeaders = (token) => ({
  headers: {
    "x-table-session-token": token,
  },
});