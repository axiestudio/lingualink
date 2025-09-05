#!/usr/bin/env python3
"""
🚀 LinguaLink AI - Model Download Script
Pre-download models for Docker build optimization
"""

import os
import sys
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from app.core.config import get_settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_models():
    """Download and cache models for production deployment"""
    try:
        settings = get_settings()
        
        logger.info(f"🚀 Starting model download: {settings.MODEL_NAME}")
        logger.info(f"📁 Cache directory: {settings.MODEL_CACHE_DIR}")
        
        # Create cache directory
        cache_dir = Path(settings.MODEL_CACHE_DIR)
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Download tokenizer
        logger.info("📥 Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            settings.MODEL_NAME,
            cache_dir=settings.MODEL_CACHE_DIR
        )
        logger.info("✅ Tokenizer downloaded successfully")
        
        # Download model
        logger.info("📥 Downloading model (this may take several minutes)...")
        model = AutoModelForSeq2SeqLM.from_pretrained(
            settings.MODEL_NAME,
            cache_dir=settings.MODEL_CACHE_DIR,
            torch_dtype="auto",  # Let transformers decide
            low_cpu_mem_usage=True
        )
        logger.info("✅ Model downloaded successfully")
        
        # Verify download
        model_files = list(cache_dir.rglob("*"))
        total_size = sum(f.stat().st_size for f in model_files if f.is_file())
        logger.info(f"📊 Downloaded {len(model_files)} files, total size: {total_size / 1024 / 1024:.1f} MB")
        
        logger.info("🎉 Model download completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Model download failed: {e}")
        return False

if __name__ == "__main__":
    success = download_models()
    sys.exit(0 if success else 1)
