"""
Pydantic models for translation API requests and responses
Compatible with frontend interface
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime

class TranslationRequest(BaseModel):
    """Translation request model - matches frontend API"""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to translate")
    targetLanguage: str = Field(..., min_length=2, max_length=10, description="Target language code")
    sourceLanguage: Optional[str] = Field(None, min_length=2, max_length=10, description="Source language code (auto-detect if not provided)")
    
    @validator('text')
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError('Text cannot be empty')
        return v.strip()
    
    @validator('targetLanguage', 'sourceLanguage')
    def validate_language_codes(cls, v):
        if v and len(v) < 2:
            raise ValueError('Language code must be at least 2 characters')
        return v.lower() if v else v

class TranslationResult(BaseModel):
    """Translation result model - matches frontend interface"""
    translatedText: str = Field(..., description="Translated text")
    originalText: str = Field(..., description="Original input text")
    sourceLanguage: str = Field(..., description="Detected or provided source language")
    targetLanguage: str = Field(..., description="Target language")
    translator: str = Field(default="nllb-200", description="Translation model used")
    cached: Optional[bool] = Field(None, description="Whether result was cached")
    processingTime: Optional[float] = Field(None, description="Processing time in seconds")
    confidence: Optional[float] = Field(None, description="Translation confidence score")

class TranslationResponse(BaseModel):
    """Translation API response - matches frontend interface"""
    success: bool = Field(default=True, description="Request success status")
    translation: TranslationResult = Field(..., description="Translation result")

class LanguageOption(BaseModel):
    """Language option model"""
    code: str = Field(..., description="Language code")
    name: str = Field(..., description="Language name in English")
    nativeName: str = Field(..., description="Language name in native script")

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether translation model is loaded")
    model_name: str = Field(..., description="Name of loaded model")
    device: str = Field(..., description="Device being used (cpu/cuda/mps)")
    memory_usage: Optional[Dict[str, Any]] = Field(None, description="Memory usage statistics")
    uptime: float = Field(..., description="Service uptime in seconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Health check timestamp")

class PerformanceMetrics(BaseModel):
    """Performance metrics model"""
    totalRequests: int = Field(default=0, description="Total translation requests")
    successfulTranslations: int = Field(default=0, description="Successful translations")
    failedTranslations: int = Field(default=0, description="Failed translations")
    averageResponseTime: float = Field(default=0.0, description="Average response time in seconds")
    cacheHitRate: float = Field(default=0.0, description="Cache hit rate percentage")
    modelUsage: Dict[str, int] = Field(default_factory=dict, description="Model usage statistics")
    memoryUsage: Optional[Dict[str, Any]] = Field(None, description="Memory usage statistics")
    lastUpdated: datetime = Field(default_factory=datetime.utcnow, description="Last metrics update")

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Detailed error information")
    code: Optional[str] = Field(None, description="Error code")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")

class BatchTranslationRequest(BaseModel):
    """Batch translation request for multiple texts"""
    texts: List[str] = Field(..., min_items=1, max_items=10, description="List of texts to translate")
    targetLanguage: str = Field(..., description="Target language code")
    sourceLanguage: Optional[str] = Field(None, description="Source language code")
    
    @validator('texts')
    def validate_texts(cls, v):
        if not v:
            raise ValueError('At least one text is required')
        for text in v:
            if not text or not text.strip():
                raise ValueError('All texts must be non-empty')
        return [text.strip() for text in v]

class BatchTranslationResponse(BaseModel):
    """Batch translation response"""
    success: bool = Field(default=True, description="Request success status")
    translations: List[TranslationResult] = Field(..., description="List of translation results")
    totalProcessingTime: float = Field(..., description="Total processing time for all translations")

# Cache models
class CacheEntry(BaseModel):
    """Cache entry model"""
    translatedText: str
    timestamp: datetime
    translator: str
    confidence: Optional[float] = None
    hitCount: int = Field(default=1, description="Number of times this cache entry was used")

class CacheStats(BaseModel):
    """Cache statistics model"""
    totalEntries: int = Field(default=0, description="Total cache entries")
    hitRate: float = Field(default=0.0, description="Cache hit rate percentage")
    memoryUsage: int = Field(default=0, description="Cache memory usage in bytes")
    oldestEntry: Optional[datetime] = Field(None, description="Timestamp of oldest cache entry")
    newestEntry: Optional[datetime] = Field(None, description="Timestamp of newest cache entry")
