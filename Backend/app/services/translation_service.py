"""
🚀 LinguaLink AI Translation Service
Advanced local machine translation using Meta's NLLB-200 model
Fully offline, GPU-accelerated, with intelligent caching
"""

import asyncio
import logging
import time
import hashlib
import psutil
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
import gc

from app.core.config import get_settings, get_nllb_language_code, get_iso_language_code, NLLB_LANGUAGE_MAPPING
from app.models.translation import (
    TranslationResult, PerformanceMetrics, LanguageOption, 
    CacheEntry, CacheStats
)

logger = logging.getLogger(__name__)

class TranslationCache:
    """High-performance in-memory translation cache"""
    
    def __init__(self, max_size: int = 1000, ttl: int = 3600):
        self.max_size = max_size
        self.ttl = ttl
        self.cache: Dict[str, CacheEntry] = {}
        self.access_times: Dict[str, datetime] = {}
        self.hit_count = 0
        self.miss_count = 0
    
    def _generate_key(self, text: str, source_lang: str, target_lang: str) -> str:
        """Generate cache key from translation parameters"""
        content = f"{text}|{source_lang}|{target_lang}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def get(self, text: str, source_lang: str, target_lang: str) -> Optional[CacheEntry]:
        """Get cached translation if available and not expired"""
        key = self._generate_key(text, source_lang, target_lang)
        
        if key in self.cache:
            entry = self.cache[key]
            # Check if entry is still valid
            if datetime.utcnow() - entry.timestamp < timedelta(seconds=self.ttl):
                self.access_times[key] = datetime.utcnow()
                entry.hitCount += 1
                self.hit_count += 1
                logger.debug(f"Cache HIT for key: {key[:8]}...")
                return entry
            else:
                # Remove expired entry
                del self.cache[key]
                del self.access_times[key]
        
        self.miss_count += 1
        logger.debug(f"Cache MISS for key: {key[:8]}...")
        return None
    
    def set(self, text: str, source_lang: str, target_lang: str, entry: CacheEntry) -> None:
        """Store translation in cache with LRU eviction"""
        key = self._generate_key(text, source_lang, target_lang)
        
        # Evict oldest entries if cache is full
        if len(self.cache) >= self.max_size:
            self._evict_lru()
        
        self.cache[key] = entry
        self.access_times[key] = datetime.utcnow()
        logger.debug(f"Cache SET for key: {key[:8]}...")
    
    def _evict_lru(self) -> None:
        """Evict least recently used cache entries"""
        if not self.access_times:
            return
        
        # Remove 20% of cache entries (LRU)
        num_to_remove = max(1, len(self.cache) // 5)
        sorted_keys = sorted(self.access_times.items(), key=lambda x: x[1])
        
        for key, _ in sorted_keys[:num_to_remove]:
            if key in self.cache:
                del self.cache[key]
            if key in self.access_times:
                del self.access_times[key]
        
        logger.debug(f"Evicted {num_to_remove} cache entries")
    
    def get_stats(self) -> CacheStats:
        """Get cache statistics"""
        total_requests = self.hit_count + self.miss_count
        hit_rate = (self.hit_count / total_requests * 100) if total_requests > 0 else 0
        
        timestamps = [entry.timestamp for entry in self.cache.values()]
        oldest = min(timestamps) if timestamps else None
        newest = max(timestamps) if timestamps else None
        
        return CacheStats(
            totalEntries=len(self.cache),
            hitRate=hit_rate,
            memoryUsage=len(str(self.cache).encode()),
            oldestEntry=oldest,
            newestEntry=newest
        )

class TranslationService:
    """Advanced translation service with NLLB-200 model"""
    
    def __init__(self):
        self.settings = get_settings()
        self.model = None
        self.tokenizer = None
        self.pipeline = None
        self.device = None
        self.cache = TranslationCache(
            max_size=self.settings.CACHE_MAX_SIZE,
            ttl=self.settings.CACHE_TTL
        ) if self.settings.ENABLE_CACHING else None
        
        # Performance metrics
        self.metrics = PerformanceMetrics()
        self.start_time = time.time()
        
        # Supported languages (will be populated after model loading)
        self.supported_languages: List[LanguageOption] = []
    
    async def initialize(self) -> None:
        """Initialize the translation service and load models"""
        logger.info("🔄 Initializing translation service...")
        
        try:
            # Determine device
            self.device = self._get_optimal_device()
            logger.info(f"🖥️ Using device: {self.device}")
            
            # Load model and tokenizer
            await self._load_model()
            
            # Initialize supported languages
            self._initialize_supported_languages()
            
            logger.info("✅ Translation service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize translation service: {e}")
            raise
    
    def _get_optimal_device(self) -> str:
        """Determine the optimal device for model inference"""
        if self.settings.DEVICE != "auto":
            return self.settings.DEVICE
        
        # Auto-detect best device
        if torch.cuda.is_available():
            device = "cuda"
            logger.info(f"🚀 CUDA available: {torch.cuda.get_device_name()}")
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            device = "mps"  # Apple Silicon
            logger.info("🍎 MPS (Apple Silicon) available")
        else:
            device = "cpu"
            logger.info("💻 Using CPU")
        
        return device
    
    async def _load_model(self) -> None:
        """Load NLLB-200 model and tokenizer"""
        logger.info(f"📥 Loading model: {self.settings.MODEL_NAME}")
        
        try:
            # Load tokenizer
            logger.info("Loading tokenizer...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.settings.MODEL_NAME,
                cache_dir=self.settings.MODEL_CACHE_DIR
            )
            
            # Load model
            logger.info("Loading model...")
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                self.settings.MODEL_NAME,
                cache_dir=self.settings.MODEL_CACHE_DIR,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                low_cpu_mem_usage=self.settings.LOW_MEMORY_MODE
            )
            
            # Move model to device
            self.model = self.model.to(self.device)
            
            # Enable compilation for PyTorch 2.0+ (if enabled)
            if self.settings.TORCH_COMPILE and hasattr(torch, 'compile'):
                logger.info("🔧 Compiling model for optimization...")
                self.model = torch.compile(self.model)
            
            # Create translation pipeline
            self.pipeline = pipeline(
                "translation",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if self.device == "cuda" else -1,
                max_length=self.settings.MAX_LENGTH,
                batch_size=self.settings.BATCH_SIZE
            )
            
            logger.info("✅ Model loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            raise
    
    def _initialize_supported_languages(self) -> None:
        """Initialize list of supported languages"""
        # Create language options from NLLB mapping
        self.supported_languages = []
        
        # Add languages from our mapping
        for iso_code, nllb_code in NLLB_LANGUAGE_MAPPING.items():
            # Get language names (simplified for now)
            language_names = {
                'en': ('English', 'English'),
                'es': ('Spanish', 'Español'),
                'fr': ('French', 'Français'),
                'de': ('German', 'Deutsch'),
                'it': ('Italian', 'Italiano'),
                'pt': ('Portuguese', 'Português'),
                'ru': ('Russian', 'Русский'),
                'zh': ('Chinese (Simplified)', '中文 (简体)'),
                'zh-TW': ('Chinese (Traditional)', '中文 (繁體)'),
                'ja': ('Japanese', '日本語'),
                'ko': ('Korean', '한국어'),
                'ar': ('Arabic', 'العربية'),
                'hi': ('Hindi', 'हिन्दी'),
                # Add more as needed
            }
            
            name, native_name = language_names.get(iso_code, (iso_code.upper(), iso_code.upper()))
            
            self.supported_languages.append(LanguageOption(
                code=iso_code,
                name=name,
                nativeName=native_name
            ))
        
        logger.info(f"📋 Initialized {len(self.supported_languages)} supported languages")
    
    async def translate_text(
        self, 
        text: str, 
        target_language: str, 
        source_language: Optional[str] = None
    ) -> TranslationResult:
        """Translate text using NLLB-200 model"""
        start_time = time.time()
        request_id = hashlib.md5(f"{text}{target_language}{time.time()}".encode()).hexdigest()[:8]
        
        try:
            logger.info(f"🔄 [{request_id}] Translation request: '{text[:50]}...' | {source_language or 'auto'} → {target_language}")
            
            # Input validation
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            text = text.strip()
            
            # Convert language codes to NLLB format
            target_nllb = get_nllb_language_code(target_language)
            source_nllb = get_nllb_language_code(source_language) if source_language else None
            
            # Auto-detect source language if not provided
            if not source_nllb:
                source_nllb = await self._detect_language(text)
                source_language = get_iso_language_code(source_nllb)
            
            # Check cache first
            if self.cache and self.settings.ENABLE_CACHING:
                cached_result = self.cache.get(text, source_language, target_language)
                if cached_result:
                    processing_time = time.time() - start_time
                    logger.info(f"✅ [{request_id}] Cache hit - returned in {processing_time:.2f}s")
                    
                    return TranslationResult(
                        translatedText=cached_result.translatedText,
                        originalText=text,
                        sourceLanguage=source_language,
                        targetLanguage=target_language,
                        translator="nllb-200",
                        cached=True,
                        processingTime=processing_time,
                        confidence=cached_result.confidence
                    )
            
            # Skip translation if source and target are the same
            if source_language == target_language:
                processing_time = time.time() - start_time
                logger.info(f"✅ [{request_id}] Same language - no translation needed")
                
                result = TranslationResult(
                    translatedText=text,
                    originalText=text,
                    sourceLanguage=source_language,
                    targetLanguage=target_language,
                    translator="nllb-200",
                    cached=False,
                    processingTime=processing_time,
                    confidence=1.0
                )
                
                # Cache the result
                if self.cache:
                    cache_entry = CacheEntry(
                        translatedText=text,
                        timestamp=datetime.utcnow(),
                        translator="nllb-200",
                        confidence=1.0
                    )
                    self.cache.set(text, source_language, target_language, cache_entry)
                
                return result
            
            # Perform translation
            translated_text = await self._perform_translation(text, source_nllb, target_nllb)
            
            processing_time = time.time() - start_time
            
            # Create result
            result = TranslationResult(
                translatedText=translated_text,
                originalText=text,
                sourceLanguage=source_language,
                targetLanguage=target_language,
                translator="nllb-200",
                cached=False,
                processingTime=processing_time,
                confidence=0.95  # NLLB-200 generally has high confidence
            )
            
            # Cache the result
            if self.cache:
                cache_entry = CacheEntry(
                    translatedText=translated_text,
                    timestamp=datetime.utcnow(),
                    translator="nllb-200",
                    confidence=0.95
                )
                self.cache.set(text, source_language, target_language, cache_entry)
            
            # Update metrics
            self.metrics.totalRequests += 1
            self.metrics.successfulTranslations += 1
            self._update_average_response_time(processing_time)
            
            logger.info(f"✅ [{request_id}] Translation completed in {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self.metrics.totalRequests += 1
            self.metrics.failedTranslations += 1
            
            logger.error(f"❌ [{request_id}] Translation failed after {processing_time:.2f}s: {e}")
            raise
    
    async def _detect_language(self, text: str) -> str:
        """Detect language of input text (simplified implementation)"""
        # For now, default to English if not specified
        # In a production system, you might want to use a dedicated language detection model
        return "eng_Latn"  # Default to English
    
    async def _perform_translation(self, text: str, source_lang: str, target_lang: str) -> str:
        """Perform the actual translation using the model"""
        try:
            # Set source language for tokenizer
            self.tokenizer.src_lang = source_lang
            
            # Prepare input
            inputs = self.tokenizer(text, return_tensors="pt", max_length=self.settings.MAX_LENGTH, truncation=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Generate translation
            with torch.no_grad():
                generated_tokens = self.model.generate(
                    **inputs,
                    forced_bos_token_id=self.tokenizer.lang_code_to_id[target_lang],
                    max_length=self.settings.MAX_LENGTH,
                    num_beams=4,
                    early_stopping=True,
                    do_sample=False
                )
            
            # Decode result
            translated_text = self.tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
            
            return translated_text.strip()
            
        except Exception as e:
            logger.error(f"Translation model error: {e}")
            raise
    
    def _update_average_response_time(self, response_time: float) -> None:
        """Update average response time metric"""
        total_successful = self.metrics.successfulTranslations
        if total_successful == 1:
            self.metrics.averageResponseTime = response_time
        else:
            # Running average
            self.metrics.averageResponseTime = (
                (self.metrics.averageResponseTime * (total_successful - 1) + response_time) / total_successful
            )
    
    async def get_supported_languages(self) -> List[LanguageOption]:
        """Get list of supported languages"""
        return self.supported_languages
    
    async def get_performance_metrics(self) -> PerformanceMetrics:
        """Get current performance metrics"""
        # Update cache hit rate
        if self.cache:
            cache_stats = self.cache.get_stats()
            self.metrics.cacheHitRate = cache_stats.hitRate
        
        # Update memory usage
        self.metrics.memoryUsage = self._get_memory_usage()
        self.metrics.lastUpdated = datetime.utcnow()
        
        return self.metrics
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get service health status"""
        uptime = time.time() - self.start_time
        
        return {
            "status": "healthy" if self.model is not None else "unhealthy",
            "model_loaded": self.model is not None,
            "model_name": self.settings.MODEL_NAME,
            "device": str(self.device),
            "memory_usage": self._get_memory_usage(),
            "uptime": uptime
        }
    
    def _get_memory_usage(self) -> Dict[str, Any]:
        """Get current memory usage statistics"""
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            
            usage = {
                "rss": memory_info.rss,  # Resident Set Size
                "vms": memory_info.vms,  # Virtual Memory Size
                "percent": process.memory_percent(),
                "available": psutil.virtual_memory().available
            }
            
            # Add GPU memory if available
            if torch.cuda.is_available() and self.device == "cuda":
                usage["gpu_allocated"] = torch.cuda.memory_allocated()
                usage["gpu_reserved"] = torch.cuda.memory_reserved()
                usage["gpu_max_allocated"] = torch.cuda.max_memory_allocated()
            
            return usage
            
        except Exception as e:
            logger.warning(f"Failed to get memory usage: {e}")
            return {}
    
    async def cleanup(self) -> None:
        """Cleanup resources"""
        logger.info("🔄 Cleaning up translation service...")
        
        try:
            # Clear cache
            if self.cache:
                self.cache.cache.clear()
                self.cache.access_times.clear()
            
            # Clear GPU memory
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            # Force garbage collection
            gc.collect()
            
            logger.info("✅ Translation service cleanup completed")
            
        except Exception as e:
            logger.error(f"❌ Error during cleanup: {e}")
