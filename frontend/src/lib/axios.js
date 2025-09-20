import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://lingualink-lcyv.onrender.com/api",
  withCredentials: true,
});
