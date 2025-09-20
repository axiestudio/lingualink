import { ENV } from '../lib/env.js';

// CORS configuration
export const corsConfig = {
  origin: function (origin, callback) {
    console.log('🌐 CORS Check - Origin:', origin);
    console.log('🌐 CORS Check - CLIENT_URL:', ENV.CLIENT_URL);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS - No origin, allowing');
      return callback(null, true);
    }

    const allowedOrigins = [
      ENV.CLIENT_URL,
      'https://www.lingualink.tech',
      'https://lingualink.tech',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5174',
    ];

    console.log('🌐 CORS Check - Allowed origins:', allowedOrigins);

    // Allow localhost origins for development even in production
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));

    if (allowedOrigins.indexOf(origin) !== -1 || isLocalhost) {
      console.log('✅ CORS - Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS - Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Forwarded-For'
  ],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400, // 24 hours
};

// Helmet configuration
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", ENV.CLIENT_URL],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Socket.io compatibility
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
};

// Security headers for Socket.io
export const socketSecurityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Input sanitization patterns
export const sanitizationPatterns = {
  // Remove potentially dangerous HTML/JS
  htmlTags: /<[^>]*>/g,
  scriptTags: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  xssPatterns: /(javascript:|vbscript:|onload=|onerror=|onclick=)/gi,
};

// File upload security
export const fileUploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxImageDimensions: {
    width: 2048,
    height: 2048
  }
};

// Password security requirements
export const passwordRequirements = {
  minLength: 6,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional for better UX
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
};
