import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://lingualink-lcyv.onrender.com/api",
  withCredentials: true,
});
