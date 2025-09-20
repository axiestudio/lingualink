import rateLimit from 'express-rate-limit';
import { ENV } from '../lib/env.js';

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (ENV.NODE_ENV === 'development' || ENV.ALLOW_DEV_RATE_LIMITS === 'true') ? 1000 : 100, // Much higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting in development or when dev rate limits are allowed
    if (ENV.NODE_ENV === 'development' || ENV.ALLOW_DEV_RATE_LIMITS === 'true') {
      return true; // Skip all rate limiting for development
    }
    return false;
  },
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (ENV.NODE_ENV === 'development' || ENV.ALLOW_DEV_RATE_LIMITS === 'true') ? 1000 : 5, // Much higher limit in development
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development or when dev rate limits are allowed
    if (ENV.NODE_ENV === 'development' || ENV.ALLOW_DEV_RATE_LIMITS === 'true') {
      return true; // Skip all rate limiting for development
    }
    return false;
  },
});

// Rate limiting for message sending
export const messageRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: ENV.NODE_ENV === 'development' ? 1000 : 30, // Much higher limit in development
  message: {
    error: 'Too many messages sent, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development for localhost and common dev IPs
    if (ENV.NODE_ENV === 'development') {
      const devIPs = ['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'];
      return devIPs.includes(req.ip) || req.ip.includes('127.0.0.1') || req.ip.includes('::1');
    }
    return false;
  },
});

// Rate limiting for file uploads (images)
export const uploadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: ENV.NODE_ENV === 'development' ? 1000 : 10, // Much higher limit in development
  message: {
    error: 'Too many file uploads, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development for localhost and common dev IPs
    if (ENV.NODE_ENV === 'development') {
      const devIPs = ['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'];
      return devIPs.includes(req.ip) || req.ip.includes('127.0.0.1') || req.ip.includes('::1');
    }
    return false;
  },
});
