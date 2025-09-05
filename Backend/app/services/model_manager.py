"""
Model Management Service for LinguaLink AI
Handles model loading, optimization, and resource management
"""

import os
import logging
import torch
import psutil
from typing import Dict, Any, Optional
from pathlib import Path
import shutil
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from huggingface_hub import snapshot_download

from app.core.config import get_settings

logger = logging.getLogger(__name__)

class ModelManager:
    """Manages model downloading, loading, and optimization"""
    
    def __init__(self):
        self.settings = get_settings()
        self.model_cache_dir = Path(self.settings.MODEL_CACHE_DIR)
        self.model_cache_dir.mkdir(parents=True, exist_ok=True)
    
    async def ensure_model_available(self) -> bool:
        """Ensure the translation model is downloaded and available"""
        try:
            model_path = self.model_cache_dir / self.settings.MODEL_NAME.replace("/", "--")
            
            if not model_path.exists():
                logger.info(f"📥 Model not found locally. Downloading {self.settings.MODEL_NAME}...")
                await self._download_model()
            else:
                logger.info(f"✅ Model found locally at {model_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to ensure model availability: {e}")
            return False
    
    async def _download_model(self) -> None:
        """Download model from Hugging Face Hub"""
        try:
            logger.info(f"🔄 Downloading model: {self.settings.MODEL_NAME}")
            
            # Check available disk space
            available_space = shutil.disk_usage(self.model_cache_dir).free
            required_space = 2 * 1024 * 1024 * 1024  # 2GB minimum
            
            if available_space < required_space:
                raise RuntimeError(f"Insufficient disk space. Required: {required_space/1024/1024/1024:.1f}GB, Available: {available_space/1024/1024/1024:.1f}GB")
            
            # Download model files
            snapshot_download(
                repo_id=self.settings.MODEL_NAME,
                cache_dir=self.settings.MODEL_CACHE_DIR,
                resume_download=True,
                local_files_only=False
            )
            
            logger.info("✅ Model download completed")
            
        except Exception as e:
            logger.error(f"❌ Model download failed: {e}")
            raise
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model"""
        model_path = self.model_cache_dir / self.settings.MODEL_NAME.replace("/", "--")
        
        info = {
            "model_name": self.settings.MODEL_NAME,
            "model_path": str(model_path),
            "model_exists": model_path.exists(),
            "cache_dir": str(self.model_cache_dir),
            "device": self.settings.DEVICE
        }
        
        if model_path.exists():
            try:
                # Get model size
                total_size = sum(f.stat().st_size for f in model_path.rglob('*') if f.is_file())
                info["model_size_bytes"] = total_size
                info["model_size_mb"] = total_size / (1024 * 1024)
                
                # Get file count
                info["file_count"] = len(list(model_path.rglob('*')))
                
            except Exception as e:
                logger.warning(f"Failed to get model size info: {e}")
        
        return info
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get system information relevant to model performance"""
        try:
            # CPU info
            cpu_info = {
                "cpu_count": psutil.cpu_count(),
                "cpu_count_logical": psutil.cpu_count(logical=True),
                "cpu_percent": psutil.cpu_percent(interval=1),
                "cpu_freq": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
            }
            
            # Memory info
            memory = psutil.virtual_memory()
            memory_info = {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used,
                "free": memory.free
            }
            
            # Disk info
            disk = shutil.disk_usage(self.model_cache_dir)
            disk_info = {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "cache_dir": str(self.model_cache_dir)
            }
            
            # GPU info
            gpu_info = {}
            if torch.cuda.is_available():
                gpu_info = {
                    "cuda_available": True,
                    "cuda_version": torch.version.cuda,
                    "device_count": torch.cuda.device_count(),
                    "current_device": torch.cuda.current_device(),
                    "device_name": torch.cuda.get_device_name(),
                    "memory_allocated": torch.cuda.memory_allocated(),
                    "memory_reserved": torch.cuda.memory_reserved(),
                    "memory_total": torch.cuda.get_device_properties(0).total_memory
                }
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                gpu_info = {
                    "mps_available": True,
                    "device_name": "Apple Silicon GPU"
                }
            else:
                gpu_info = {"gpu_available": False}
            
            return {
                "cpu": cpu_info,
                "memory": memory_info,
                "disk": disk_info,
                "gpu": gpu_info,
                "torch_version": torch.__version__,
                "python_version": f"{psutil.sys.version_info.major}.{psutil.sys.version_info.minor}.{psutil.sys.version_info.micro}"
            }
            
        except Exception as e:
            logger.error(f"Failed to get system info: {e}")
            return {"error": str(e)}
    
    def optimize_model_settings(self) -> Dict[str, Any]:
        """Suggest optimal model settings based on system capabilities"""
        system_info = self.get_system_info()
        recommendations = {}
        
        try:
            # Memory-based recommendations
            memory_gb = system_info["memory"]["total"] / (1024**3)
            
            if memory_gb < 8:
                recommendations.update({
                    "model_suggestion": "facebook/nllb-200-distilled-600M",  # Smaller model
                    "low_memory_mode": True,
                    "batch_size": 1,
                    "max_length": 256,
                    "torch_dtype": "float32"
                })
            elif memory_gb < 16:
                recommendations.update({
                    "model_suggestion": "facebook/nllb-200-distilled-600M",
                    "low_memory_mode": False,
                    "batch_size": 2,
                    "max_length": 512,
                    "torch_dtype": "float16" if system_info["gpu"].get("cuda_available") else "float32"
                })
            else:
                recommendations.update({
                    "model_suggestion": "facebook/nllb-200-1.3B",  # Larger, more accurate model
                    "low_memory_mode": False,
                    "batch_size": 4,
                    "max_length": 512,
                    "torch_dtype": "float16" if system_info["gpu"].get("cuda_available") else "float32"
                })
            
            # Device recommendations
            if system_info["gpu"].get("cuda_available"):
                recommendations["device"] = "cuda"
                recommendations["torch_compile"] = True
            elif system_info["gpu"].get("mps_available"):
                recommendations["device"] = "mps"
                recommendations["torch_compile"] = False  # MPS doesn't support torch.compile yet
            else:
                recommendations["device"] = "cpu"
                recommendations["torch_compile"] = False
                recommendations["num_workers"] = min(4, system_info["cpu"]["cpu_count"])
            
            # Cache recommendations
            cache_size = min(2000, max(500, int(memory_gb * 100)))  # Scale with available memory
            recommendations.update({
                "cache_max_size": cache_size,
                "cache_ttl": 3600,
                "enable_caching": True
            })
            
            return {
                "current_settings": {
                    "model_name": self.settings.MODEL_NAME,
                    "device": self.settings.DEVICE,
                    "batch_size": self.settings.BATCH_SIZE,
                    "max_length": self.settings.MAX_LENGTH,
                    "low_memory_mode": self.settings.LOW_MEMORY_MODE,
                    "cache_max_size": self.settings.CACHE_MAX_SIZE
                },
                "recommendations": recommendations,
                "system_summary": {
                    "memory_gb": round(memory_gb, 1),
                    "cpu_cores": system_info["cpu"]["cpu_count"],
                    "gpu_available": system_info["gpu"].get("cuda_available", False) or system_info["gpu"].get("mps_available", False),
                    "gpu_type": system_info["gpu"].get("device_name", "None")
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate recommendations: {e}")
            return {"error": str(e)}
    
    async def cleanup_cache(self, keep_current_model: bool = True) -> Dict[str, Any]:
        """Clean up model cache directory"""
        try:
            current_model_path = self.model_cache_dir / self.settings.MODEL_NAME.replace("/", "--")
            
            total_freed = 0
            files_removed = 0
            
            for item in self.model_cache_dir.iterdir():
                if item.is_dir():
                    if keep_current_model and item == current_model_path:
                        continue
                    
                    # Calculate size before removal
                    size = sum(f.stat().st_size for f in item.rglob('*') if f.is_file())
                    file_count = len(list(item.rglob('*')))
                    
                    # Remove directory
                    shutil.rmtree(item)
                    
                    total_freed += size
                    files_removed += file_count
                    
                    logger.info(f"Removed cached model: {item.name}")
            
            return {
                "success": True,
                "total_freed_bytes": total_freed,
                "total_freed_mb": total_freed / (1024 * 1024),
                "files_removed": files_removed,
                "current_model_kept": keep_current_model
            }
            
        except Exception as e:
            logger.error(f"Cache cleanup failed: {e}")
            return {"success": False, "error": str(e)}
