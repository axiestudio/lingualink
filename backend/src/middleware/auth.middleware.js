import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const protectRoute = async (req, res, next) => {
  try {
    console.log("🔐 Auth middleware - All cookies:", Object.keys(req.cookies));
    console.log("🔐 Auth middleware - Origin:", req.headers.origin);
    console.log("🔐 Auth middleware - Cookie header:", req.headers.cookie);

    const token = req.cookies.jwt;
    console.log("🔐 Auth middleware - JWT token present:", !!token);

    if (!token) {
      console.log("❌ No JWT token found in cookies");
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) return res.status(401).json({ message: "Unauthorized - Invalid token" });

    const user = await User.findByIdWithoutPassword(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
