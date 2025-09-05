"""
Logging configuration for LinguaLink AI Backend
"""

import logging
import sys
from typing import Optional
from app.core.config import get_settings

def setup_logging(log_level: Optional[str] = None) -> None:
    """Setup application logging configuration"""
    settings = get_settings()
    
    # Use provided log level or default from settings
    level = log_level or settings.LOG_LEVEL
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format=settings.LOG_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Configure specific loggers
    loggers = {
        "uvicorn": logging.INFO,
        "uvicorn.error": logging.INFO,
        "uvicorn.access": logging.WARNING,  # Reduce access log noise
        "transformers": logging.WARNING,    # Reduce transformers noise
        "torch": logging.WARNING,           # Reduce PyTorch noise
        "app": getattr(logging, level.upper()),  # Our application logs
    }
    
    for logger_name, logger_level in loggers.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(logger_level)
    
    # Create application logger
    app_logger = logging.getLogger("app")
    app_logger.info("🚀 Logging configured successfully")
    
    return app_logger
