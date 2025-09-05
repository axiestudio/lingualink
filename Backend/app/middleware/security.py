"""
🔒 Security Middleware for LinguaLink AI Backend
Rate limiting, input validation, and security headers
"""

import time
import hashlib
import logging
from typing import Dict, Optional
from collections import defaultdict, deque
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import get_settings

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using sliding window algorithm"""
    
    def __init__(self, app, calls_per_minute: int = 60):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.window_size = 60  # 1 minute window
        self.client_requests: Dict[str, deque] = defaultdict(deque)
        
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier from request"""
        # Try to get real IP from headers (for reverse proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        # Include user agent for better identification
        user_agent = request.headers.get("User-Agent", "")
        client_id = hashlib.md5(f"{client_ip}:{user_agent}".encode()).hexdigest()
        
        return client_id
    
    def _is_rate_limited(self, client_id: str) -> bool:
        """Check if client is rate limited using sliding window"""
        now = time.time()
        window_start = now - self.window_size
        
        # Get client's request history
        requests = self.client_requests[client_id]
        
        # Remove old requests outside the window
        while requests and requests[0] < window_start:
            requests.popleft()
        
        # Check if client has exceeded the limit
        if len(requests) >= self.calls_per_minute:
            return True
        
        # Add current request
        requests.append(now)
        
        return False
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        settings = get_settings()
        
        # Skip rate limiting if disabled
        if not settings.ENABLE_RATE_LIMITING:
            return await call_next(request)
        
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/", "/docs", "/redoc"]:
            return await call_next(request)
        
        client_id = self._get_client_id(request)
        
        if self._is_rate_limited(client_id):
            logger.warning(f"Rate limit exceeded for client: {client_id[:8]}...")
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Maximum {self.calls_per_minute} requests per minute allowed",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )
        
        return await call_next(request)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        """Add security headers to response"""
        response = await call_next(request)
        
        # Security headers
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        }
        
        # Add headers to response
        for header, value in security_headers.items():
            response.headers[header] = value
        
        return response

class InputValidationMiddleware(BaseHTTPMiddleware):
    """Validate and sanitize input data"""
    
    def __init__(self, app):
        super().__init__(app)
        self.max_content_length = 10 * 1024 * 1024  # 10MB max request size
    
    async def dispatch(self, request: Request, call_next):
        """Validate request input"""
        
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_content_length:
            logger.warning(f"Request too large: {content_length} bytes")
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={
                    "error": "Request too large",
                    "message": f"Maximum request size is {self.max_content_length} bytes"
                }
            )
        
        # Validate content type for POST requests
        if request.method == "POST":
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith("application/json"):
                logger.warning(f"Invalid content type: {content_type}")
                return JSONResponse(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    content={
                        "error": "Unsupported media type",
                        "message": "Content-Type must be application/json"
                    }
                )
        
        return await call_next(request)

class APIKeyMiddleware(BaseHTTPMiddleware):
    """API key authentication middleware"""
    
    def __init__(self, app):
        super().__init__(app)
        self.settings = get_settings()
    
    async def dispatch(self, request: Request, call_next):
        """Validate API key if authentication is enabled"""
        
        # Skip API key validation if disabled
        if not self.settings.ENABLE_API_KEY_AUTH:
            return await call_next(request)
        
        # Skip API key for public endpoints
        public_endpoints = ["/", "/health", "/docs", "/redoc", "/openapi.json"]
        if request.url.path in public_endpoints:
            return await call_next(request)
        
        # Check for API key
        api_key = request.headers.get(self.settings.API_KEY_HEADER)
        
        if not api_key:
            logger.warning("Missing API key")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "error": "Authentication required",
                    "message": f"API key required in {self.settings.API_KEY_HEADER} header"
                }
            )
        
        # Validate API key
        if self.settings.ALLOWED_API_KEYS and api_key not in self.settings.ALLOWED_API_KEYS:
            logger.warning(f"Invalid API key: {api_key[:8]}...")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "error": "Invalid API key",
                    "message": "The provided API key is not valid"
                }
            )
        
        return await call_next(request)

class LoggingMiddleware(BaseHTTPMiddleware):
    """Enhanced logging middleware for production"""
    
    async def dispatch(self, request: Request, call_next):
        """Log request and response details"""
        start_time = time.time()
        
        # Log request
        client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        logger.info(f"📥 {request.method} {request.url.path} from {client_ip}")
        
        # Process request
        try:
            response = await call_next(request)
            
            # Log response
            process_time = time.time() - start_time
            logger.info(f"📤 {response.status_code} {request.url.path} ({process_time:.3f}s)")
            
            # Add processing time header
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"❌ {request.method} {request.url.path} failed after {process_time:.3f}s: {e}")
            raise
