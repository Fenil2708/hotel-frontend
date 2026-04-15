import axios from "axios";

export const API_URL = "http://localhost:5000/api";

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
    }
});
