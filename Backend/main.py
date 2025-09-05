"""
🚀 LinguaLink AI - FastAPI Backend with Embedded Translation
Advanced local machine translation using Meta's NLLB-200 model
No external API dependencies - fully offline capable
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging
from typing import Optional
import time

from app.models.translation import TranslationRequest, TranslationResponse, HealthResponse
from app.services.translation_service import TranslationService
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.middleware.security import (
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    InputValidationMiddleware,
    APIKeyMiddleware,
    LoggingMiddleware
)

# Global translation service instance
translation_service: Optional[TranslationService] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown"""
    global translation_service
    
    # Startup
    logger = logging.getLogger(__name__)
    logger.info("🚀 Starting LinguaLink AI Backend...")
    
    try:
        # Initialize translation service with model loading
        translation_service = TranslationService()
        await translation_service.initialize()
        logger.info("✅ Translation service initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize translation service: {e}")
        raise
    finally:
        # Shutdown
        if translation_service:
            await translation_service.cleanup()
        logger.info("🔄 LinguaLink AI Backend shutdown complete")

# Create FastAPI app with lifespan management
app = FastAPI(
    title="LinguaLink AI Backend",
    description="Advanced local machine translation API using Meta's NLLB-200 model",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Security middleware (order matters!)
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(InputValidationMiddleware)
app.add_middleware(APIKeyMiddleware)
app.add_middleware(RateLimitMiddleware, calls_per_minute=settings.RATE_LIMIT_PER_MINUTE)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

def get_translation_service() -> TranslationService:
    """Dependency to get translation service instance"""
    if translation_service is None:
        raise HTTPException(status_code=503, detail="Translation service not initialized")
    return translation_service

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information"""
    return {
        "message": "🚀 LinguaLink AI Backend - Local Machine Translation API",
        "version": "1.0.0",
        "status": "active",
        "features": [
            "200+ language support via Meta NLLB-200",
            "Fully offline translation",
            "GPU acceleration support",
            "Intelligent caching",
            "Performance monitoring"
        ],
        "endpoints": {
            "translate": "/api/translate",
            "health": "/health",
            "languages": "/api/languages",
            "metrics": "/api/metrics"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check(service: TranslationService = Depends(get_translation_service)):
    """Enhanced health check endpoint for production monitoring"""
    try:
        health_status = await service.get_health_status()

        # Add additional health checks
        health_status.update({
            "timestamp": time.time(),
            "version": "1.0.0",
            "environment": "production" if not settings.DEBUG else "development",
            "ready": health_status.get("model_loaded", False)
        })

        return HealthResponse(**health_status)
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/health/ready")
async def readiness_check(service: TranslationService = Depends(get_translation_service)):
    """Kubernetes readiness probe endpoint"""
    try:
        health_status = await service.get_health_status()
        if health_status.get("model_loaded", False):
            return {"status": "ready", "timestamp": time.time()}
        else:
            raise HTTPException(status_code=503, detail="Service not ready")
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")

@app.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint"""
    return {"status": "alive", "timestamp": time.time()}

@app.post("/api/translate", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    service: TranslationService = Depends(get_translation_service)
):
    """
    Translate text using local NLLB-200 model
    
    Compatible with frontend API:
    - Request: {text, targetLanguage, sourceLanguage?}
    - Response: {success: true, translation: TranslationResult}
    """
    start_time = time.time()
    
    try:
        logger.info(f"🔄 Translation request: '{request.text[:50]}...' | {request.sourceLanguage or 'auto'} → {request.targetLanguage}")
        
        # Perform translation
        result = await service.translate_text(
            text=request.text,
            target_language=request.targetLanguage,
            source_language=request.sourceLanguage
        )
        
        processing_time = time.time() - start_time
        result.processingTime = processing_time
        
        logger.info(f"✅ Translation completed in {processing_time:.2f}s")
        
        return TranslationResponse(
            success=True,
            translation=result
        )
        
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"❌ Translation failed after {processing_time:.2f}s: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Translation failed",
                "details": str(e),
                "processingTime": processing_time
            }
        )

@app.get("/api/languages")
async def get_supported_languages(service: TranslationService = Depends(get_translation_service)):
    """Get list of supported languages"""
    try:
        languages = await service.get_supported_languages()
        return {
            "success": True,
            "languages": languages,
            "total": len(languages)
        }
    except Exception as e:
        logger.error(f"Failed to get languages: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve supported languages")

@app.get("/api/metrics")
async def get_metrics(service: TranslationService = Depends(get_translation_service)):
    """Get performance metrics"""
    try:
        metrics = await service.get_performance_metrics()
        return {
            "success": True,
            "metrics": metrics
        }
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve metrics")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "details": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
