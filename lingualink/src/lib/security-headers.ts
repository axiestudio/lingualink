// 🔒 ENTERPRISE-LEVEL SECURITY HEADERS

export function addSecurityHeaders(response: Response): Response {
  // 🔒 SECURITY: Content Security Policy - Development mode (more permissive for Clerk)
  const isDevelopment = process.env.NODE_ENV === 'development';

  const csp = isDevelopment ? [
    // Development CSP - more permissive for debugging
    "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:",
    "style-src 'self' 'unsafe-inline' https: http:",
    "font-src 'self' https: http: data:",
    "img-src 'self' data: https: http: blob:",
    "connect-src 'self' https: http: ws: wss:",
    "frame-src 'self' https: http:",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ') : [
    // Production CSP - strict security
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.com https://*.clerk.accounts.dev",
    "font-src 'self' https://fonts.gstatic.com https://*.clerk.com",
    "img-src 'self' data: https: blob: https://*.clerk.com https://*.clerk.accounts.dev",
    "connect-src 'self' https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://api.featherless.ai https://api.openai.com wss: ws:",
    "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.com https://*.clerk.accounts.dev",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.clerk.com https://*.clerk.accounts.dev",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  // Security headers
  const headers = new Headers(response.headers);

  // 🔒 SECURITY: Temporarily disable CSP for Clerk debugging
  if (!isDevelopment) {
    headers.set('Content-Security-Policy', csp);
  }
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Remove server information
  headers.delete('Server');
  headers.delete('X-Powered-By');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// CORS configuration for API routes
export function addCORSHeaders(response: Response, origin?: string): Response {
  const headers = new Headers(response.headers);
  
  // Allow specific origins in production
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://lingualink.tech' // Replace with your production domain
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Input validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateUsername(username: string): boolean {
  // Username: 3-30 chars, alphanumeric + underscore/hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Basic HTML sanitization - remove dangerous tags and attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .trim()
    .substring(0, 10000); // Limit length
}

// SQL injection prevention helper
export function escapeSqlString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/'/g, "''").replace(/;/g, '');
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  // Use Web Crypto API for browser compatibility
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for Node.js environment
  try {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    // Ultimate fallback using Math.random (less secure but works)
    console.warn('Crypto not available, using Math.random fallback');
    return Array.from({ length: length * 2 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Check for common attack patterns
export function detectSuspiciousActivity(input: string): boolean {
  const suspiciousPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\.location/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}
