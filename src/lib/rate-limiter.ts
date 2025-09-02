// 🔒 ENTERPRISE-LEVEL RATE LIMITING SYSTEM

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function createRateLimiter(config: RateLimitConfig) {
  return {
    check: (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
      const now = Date.now();
      const key = `${identifier}:${Math.floor(now / config.windowMs)}`;
      
      let entry = rateLimitStore.get(key);
      
      if (!entry) {
        entry = {
          count: 0,
          resetTime: now + config.windowMs
        };
        rateLimitStore.set(key, entry);
      }
      
      entry.count++;
      
      const allowed = entry.count <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - entry.count);
      
      return {
        allowed,
        remaining,
        resetTime: entry.resetTime
      };
    }
  };
}

// Pre-configured rate limiters
export const messagingRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 messages per minute
  message: 'Too many messages. Please slow down.'
});

export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 API calls per minute
  message: 'Too many requests. Please try again later.'
});

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.'
});

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Rate limit response helper
export function createRateLimitResponse(message: string, resetTime: number) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message,
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      }
    }
  );
}
