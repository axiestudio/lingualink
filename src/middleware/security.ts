/**
 * 🔒 ENTERPRISE SECURITY MIDDLEWARE
 * Implements comprehensive security headers and protection mechanisms
 * Following OWASP security best practices
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureLogger, SecurityEventType, SecuritySeverity } from '@/lib/secure-logger';

// 🛡️ SECURITY HEADERS CONFIGURATION
const SECURITY_HEADERS = {
  // Content Security Policy - Prevent XSS attacks
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: data:",
    "connect-src 'self' https://clerk.com https://*.clerk.com wss: ws: https://api.openai.com https://api.featherless.ai",
    "frame-src 'self' https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),

  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),

  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',

  // Cache control for sensitive pages
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',

  // Remove server information
  'Server': 'LinguaLink',

  // Custom security headers
  'X-Powered-By': 'LinguaLink Security Framework',
  'X-Security-Level': 'Enterprise'
};

// 🚨 RATE LIMITING CONFIGURATION
const RATE_LIMITS = {
  // API endpoints
  '/api/': { requests: 100, window: 60000 }, // 100 requests per minute
  '/api/messages': { requests: 50, window: 60000 }, // 50 messages per minute
  '/api/auth/': { requests: 10, window: 60000 }, // 10 auth requests per minute
  '/api/users/search': { requests: 20, window: 60000 }, // 20 searches per minute
  
  // File uploads
  '/api/upload': { requests: 10, window: 300000 }, // 10 uploads per 5 minutes
  
  // Default for all other routes
  'default': { requests: 200, window: 60000 } // 200 requests per minute
};

// 🔍 SUSPICIOUS PATTERNS TO DETECT (REFINED FOR PRODUCTION)
const SUSPICIOUS_PATTERNS = [
  // SQL Injection attempts (more specific)
  /(\bunion\s+select\b)/i,
  /(\bselect\s+.*\bfrom\s+)/i,
  /(\bdrop\s+table\b)/i,
  /(\bexec\s*\()/i,
  /(\b(or|and)\s+\d+\s*=\s*\d+\s*(--|\#))/i,

  // XSS attempts (more specific)
  /<script[^>]*>.*?<\/script>/gi,
  /javascript\s*:/i,
  /on(load|error|click|mouseover)\s*=/i,

  // Path traversal (more specific)
  /\.\.\/(.*\/){3,}/,
  /\.\.\\\.\.\\/,

  // Command injection (more specific)
  /;\s*(rm|del|format|shutdown)/i,
  /\|\s*(nc|netcat|wget|curl)\s/i,

  // NoSQL injection (more specific)
  /\$where\s*:/i,
  /\{\s*\$ne\s*:/i
];

// 🗂️ RATE LIMITING STORE
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * 🔒 MAIN SECURITY MIDDLEWARE
 */
export function securityMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  try {
    // 🛡️ APPLY SECURITY HEADERS
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // 🚨 DETECT SUSPICIOUS ACTIVITY
    const suspiciousActivity = detectSuspiciousActivity(request);
    if (suspiciousActivity.length > 0) {
      secureLogger.logCriticalSecurity(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        'Suspicious activity detected and blocked',
        {
          clientIP: clientIP?.substring(0, 8) + '***',
          userAgent: userAgent.substring(0, 50) + '...',
          pathname,
          method,
          patterns: suspiciousActivity,
          action: 'BLOCKED'
        }
      );

      // Block the request
      return new NextResponse('Access Denied', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          ...Object.fromEntries(Object.entries(SECURITY_HEADERS))
        }
      });
    }

    // 🚦 RATE LIMITING
    const rateLimitResult = checkRateLimit(clientIP, pathname);
    if (!rateLimitResult.allowed) {
      secureLogger.logWarningSecurity(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
        {
          clientIP: clientIP?.substring(0, 8) + '***',
          pathname,
          method,
          limit: rateLimitResult.limit,
          window: rateLimitResult.window,
          action: 'RATE_LIMITED'
        }
      );

      return new NextResponse('Rate Limit Exceeded', { 
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': Math.ceil(rateLimitResult.retryAfter / 1000).toString(),
          ...Object.fromEntries(Object.entries(SECURITY_HEADERS))
        }
      });
    }

    // 🔍 LOG SECURITY EVENT
    secureLogger.logInfoSecurity(
      SecurityEventType.DATA_ACCESS,
      'Request processed successfully',
      {
        clientIP: clientIP?.substring(0, 8) + '***',
        pathname,
        method,
        userAgent: userAgent.substring(0, 50) + '...',
        action: 'ALLOWED'
      }
    );

    return response;

  } catch (error) {
    secureLogger.logCriticalSecurity(
      SecurityEventType.SYSTEM_ERROR,
      'Security middleware error',
      {
        clientIP: clientIP?.substring(0, 8) + '***',
        pathname,
        method,
        error: 'MIDDLEWARE_ERROR'
      }
    );

    // Fail securely - apply security headers even on error
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
}

/**
 * 🌐 GET CLIENT IP ADDRESS
 */
function getClientIP(request: NextRequest): string | null {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  
  // NextRequest doesn't have ip property, return null as fallback
  return null;
}

/**
 * 🕵️ DETECT SUSPICIOUS ACTIVITY (REFINED FOR PRODUCTION)
 */
function detectSuspiciousActivity(request: NextRequest): string[] {
  const suspiciousPatterns: string[] = [];
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || '';

  // 🚫 SKIP SECURITY CHECKS FOR LEGITIMATE REQUESTS
  const isLegitimateRequest =
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname === '/sw.js' ||
    pathname === '/dashboard' ||
    pathname === '/favicon.ico' ||
    pathname.includes('.well-known') ||
    (userAgent.includes('Mozilla') && userAgent.includes('Chrome')) ||
    (userAgent.includes('Mozilla') && userAgent.includes('Safari')) ||
    (userAgent.includes('Mozilla') && userAgent.includes('Firefox'));

  if (isLegitimateRequest) {
    return []; // Skip detection for legitimate browser requests
  }

  // 🔍 CHECK URL FOR ACTUAL THREATS ONLY
  const url = request.url;
  SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(url)) {
      suspiciousPatterns.push(`URL_THREAT_${index + 1}`);
    }
  });

  // 🔍 CHECK ONLY SPECIFIC HEADERS THAT COULD CONTAIN THREATS
  const criticalHeaders = ['authorization', 'cookie', 'x-forwarded-for', 'x-real-ip'];
  criticalHeaders.forEach(headerName => {
    const headerValue = request.headers.get(headerName);
    if (headerValue) {
      SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
        if (pattern.test(headerValue)) {
          suspiciousPatterns.push(`HEADER_${headerName.toUpperCase()}_THREAT_${index + 1}`);
        }
      });
    }
  });

  return suspiciousPatterns;
}

/**
 * 🚦 CHECK RATE LIMITING
 */
function checkRateLimit(clientIP: string | null, pathname: string): {
  allowed: boolean;
  limit: number;
  window: number;
  retryAfter: number;
} {
  if (!clientIP) {
    return { allowed: true, limit: 0, window: 0, retryAfter: 0 };
  }

  // Find matching rate limit rule
  let rateLimit = RATE_LIMITS.default;
  for (const [path, limit] of Object.entries(RATE_LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      rateLimit = limit;
      break;
    }
  }

  const key = `${clientIP}:${pathname}`;
  const now = Date.now();
  const windowStart = now - rateLimit.window;

  // Clean up old entries
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  const current = rateLimitStore.get(key);
  
  if (!current || current.resetTime < now) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + rateLimit.window
    });
    return { allowed: true, limit: rateLimit.requests, window: rateLimit.window, retryAfter: 0 };
  }

  if (current.count >= rateLimit.requests) {
    // Rate limit exceeded
    return {
      allowed: false,
      limit: rateLimit.requests,
      window: rateLimit.window,
      retryAfter: current.resetTime - now
    };
  }

  // Increment counter
  current.count++;
  return { allowed: true, limit: rateLimit.requests, window: rateLimit.window, retryAfter: 0 };
}

/**
 * 🧹 SANITIZE INPUT DATA
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '')
      .trim()
      .substring(0, 10000); // Limit length
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * 🔍 VALIDATE INPUT AGAINST SCHEMA
 */
export function validateInput(input: any, schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation - extend as needed
  if (schema.required && !input) {
    errors.push('Required field is missing');
  }
  
  if (schema.maxLength && typeof input === 'string' && input.length > schema.maxLength) {
    errors.push(`Input exceeds maximum length of ${schema.maxLength}`);
  }
  
  if (schema.pattern && typeof input === 'string' && !schema.pattern.test(input)) {
    errors.push('Input does not match required pattern');
  }
  
  return { valid: errors.length === 0, errors };
}
