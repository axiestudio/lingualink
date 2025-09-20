import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:3002/api" : "https://lingualink-lcyv.onrender.com",
  withCredentials: true,
});
