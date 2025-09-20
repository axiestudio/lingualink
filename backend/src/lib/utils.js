import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // Cookie settings based on environment
  // IMPORTANT: Production uses strict security, development allows cross-site cookies
  let cookieSettings;

  if (ENV.ALLOW_DEV_RATE_LIMITS === 'true') {
    // Development mode: Allow cross-site cookies for localhost frontend
    cookieSettings = {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // prevent XSS attacks
      sameSite: "none", // Allow cross-site requests for development
      secure: true, // Required when sameSite=none
    };
  } else {
    // Production mode: Strict security settings
    cookieSettings = {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // prevent XSS attacks
      sameSite: "strict", // CSRF protection
      secure: ENV.NODE_ENV === "production", // HTTPS only in production
    };
  }

  res.cookie("jwt", token, cookieSettings);

  return token;
};

// http://localhost
// https://dsmakmk.com
