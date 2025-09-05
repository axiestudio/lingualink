#!/usr/bin/env python3
"""
🚀 LinguaLink AI - Production Startup Script
Optimized startup for production deployment
"""

import os
import sys
import logging
import uvicorn
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import get_settings
from app.core.logging import setup_logging

def main():
    """Production startup with optimized settings"""
    
    # Setup logging for production
    setup_logging()
    logger = logging.getLogger(__name__)
    
    logger.info("🚀 Starting LinguaLink AI Backend (Production Mode)")
    
    # Get settings
    settings = get_settings()
    
    # Production-specific configurations
    host = os.getenv("HOST", settings.HOST)
    port = int(os.getenv("PORT", settings.PORT))
    workers = int(os.getenv("WORKERS", "1"))  # Single worker for GPU models
    
    logger.info(f"🌐 Server configuration:")
    logger.info(f"   Host: {host}")
    logger.info(f"   Port: {port}")
    logger.info(f"   Workers: {workers}")
    logger.info(f"   Model: {settings.MODEL_NAME}")
    logger.info(f"   Device: {settings.DEVICE}")
    
    # Production uvicorn configuration
    uvicorn_config = {
        "app": "main:app",
        "host": host,
        "port": port,
        "workers": workers,
        "log_level": "info",
        "access_log": True,
        "reload": False,  # Never reload in production
        "loop": "uvloop",  # Use uvloop for better performance
        "http": "httptools",  # Use httptools for better performance
    }
    
    # Add SSL configuration if certificates are provided
    ssl_keyfile = os.getenv("SSL_KEYFILE")
    ssl_certfile = os.getenv("SSL_CERTFILE")
    
    if ssl_keyfile and ssl_certfile:
        uvicorn_config.update({
            "ssl_keyfile": ssl_keyfile,
            "ssl_certfile": ssl_certfile,
        })
        logger.info("🔒 SSL/TLS enabled")
    
    try:
        logger.info("🌟 Starting production server...")
        uvicorn.run(**uvicorn_config)
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
