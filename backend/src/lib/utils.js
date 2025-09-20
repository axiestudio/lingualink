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
      domain: undefined, // Don't set domain for cross-origin development
    };
    console.log("🍪 Setting development cookie with sameSite=none, secure=true");
  } else {
    // Production mode: Strict security settings
    cookieSettings = {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // prevent XSS attacks
      sameSite: "strict", // CSRF protection
      secure: ENV.NODE_ENV === "production", // HTTPS only in production
      domain: undefined, // Let browser handle domain
    };
    console.log("🍪 Setting production cookie with sameSite=strict");
  }

  res.cookie("jwt", token, cookieSettings);
  console.log("🍪 JWT token generated and cookie set for user:", userId);
  console.log("🍪 Cookie settings:", cookieSettings);

  return token;
};

// http://localhost
// https://dsmakmk.com
