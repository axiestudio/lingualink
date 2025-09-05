#!/usr/bin/env python3
"""
🚀 LinguaLink AI Backend Startup Script
Handles model downloading, system checks, and server startup
"""

import os
import sys
import asyncio
import logging
import argparse
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.services.model_manager import ModelManager
from app.services.translation_service import TranslationService

logger = logging.getLogger(__name__)

async def check_system_requirements():
    """Check if system meets minimum requirements"""
    logger.info("🔍 Checking system requirements...")
    
    model_manager = ModelManager()
    system_info = model_manager.get_system_info()
    
    # Check memory
    memory_gb = system_info["memory"]["total"] / (1024**3)
    if memory_gb < 4:
        logger.warning(f"⚠️ Low memory detected: {memory_gb:.1f}GB (4GB+ recommended)")
        logger.info("💡 Consider enabling LOW_MEMORY_MODE=true in .env")
    else:
        logger.info(f"✅ Memory: {memory_gb:.1f}GB")
    
    # Check disk space
    disk_free_gb = system_info["disk"]["free"] / (1024**3)
    if disk_free_gb < 2:
        logger.error(f"❌ Insufficient disk space: {disk_free_gb:.1f}GB (2GB+ required)")
        return False
    else:
        logger.info(f"✅ Disk space: {disk_free_gb:.1f}GB free")
    
    # Check GPU
    if system_info["gpu"].get("cuda_available"):
        gpu_name = system_info["gpu"]["device_name"]
        logger.info(f"🚀 CUDA GPU detected: {gpu_name}")
    elif system_info["gpu"].get("mps_available"):
        logger.info("🍎 Apple Silicon GPU detected")
    else:
        logger.info("💻 Using CPU (GPU acceleration not available)")
    
    return True

async def download_models():
    """Download required models"""
    logger.info("📥 Checking model availability...")
    
    model_manager = ModelManager()
    
    if not await model_manager.ensure_model_available():
        logger.error("❌ Failed to download models")
        return False
    
    logger.info("✅ Models ready")
    return True

async def test_translation():
    """Test translation functionality"""
    logger.info("🧪 Testing translation service...")
    
    try:
        service = TranslationService()
        await service.initialize()
        
        # Test translation
        result = await service.translate_text(
            text="Hello, world!",
            target_language="es",
            source_language="en"
        )
        
        logger.info(f"✅ Translation test successful: '{result.translatedText}'")
        
        await service.cleanup()
        return True
        
    except Exception as e:
        logger.error(f"❌ Translation test failed: {e}")
        return False

async def main():
    """Main startup routine"""
    parser = argparse.ArgumentParser(description="LinguaLink AI Backend")
    parser.add_argument("--skip-checks", action="store_true", help="Skip system checks")
    parser.add_argument("--skip-test", action="store_true", help="Skip translation test")
    parser.add_argument("--download-only", action="store_true", help="Only download models and exit")
    parser.add_argument("--port", type=int, help="Override port number")
    parser.add_argument("--host", type=str, help="Override host address")
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging()
    logger.info("🚀 Starting LinguaLink AI Backend...")
    
    settings = get_settings()
    
    # System checks
    if not args.skip_checks:
        if not await check_system_requirements():
            logger.error("❌ System requirements not met")
            sys.exit(1)
    
    # Download models
    if not await download_models():
        logger.error("❌ Model download failed")
        sys.exit(1)
    
    if args.download_only:
        logger.info("✅ Models downloaded successfully. Exiting.")
        sys.exit(0)
    
    # Test translation
    if not args.skip_test:
        if not await test_translation():
            logger.error("❌ Translation test failed")
            sys.exit(1)
    
    # Start server
    logger.info("🌟 All checks passed! Starting server...")
    
    import uvicorn
    
    host = args.host or settings.HOST
    port = args.port or settings.PORT
    
    logger.info(f"🌐 Server will be available at: http://{host}:{port}")
    logger.info(f"📖 API documentation: http://{host}:{port}/docs")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=settings.DEBUG,
        log_level="info"
    )

if __name__ == "__main__":
    asyncio.run(main())
