# 🚀 LinguaLink AI Backend - Production Dockerfile
# Multi-stage build for optimized production deployment

# ============================================================================
# Stage 1: Model Download (Heavy, cacheable layer)
# ============================================================================
FROM python:3.10-slim as model-downloader

# Install system dependencies for model downloading
RUN apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements for model downloading
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy model download script
COPY scripts/download_models.py scripts/
COPY app/core/config.py app/core/
COPY app/core/__init__.py app/core/
COPY app/__init__.py app/

# Download models (this layer will be cached)
ENV MODEL_CACHE_DIR=/app/models
ENV MODEL_NAME=facebook/nllb-200-distilled-600M
RUN python scripts/download_models.py

# ============================================================================
# Stage 2: Production Runtime (Lightweight)
# ============================================================================
FROM python:3.10-slim as production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Essential system packages
    curl \
    # For GPU support (optional)
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy models from previous stage
COPY --from=model-downloader /app/models ./models

# Copy application code
COPY app/ ./app/
COPY main.py .
COPY start.py .

# Copy production configuration
COPY scripts/production_start.py .
COPY scripts/healthcheck.py .

# Create necessary directories
RUN mkdir -p logs && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python scripts/healthcheck.py

# Production startup command
CMD ["python", "production_start.py"]

# ============================================================================
# Stage 3: Development (Optional, for local development)
# ============================================================================
FROM production as development

# Switch back to root for development tools
USER root

# Install development dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-asyncio \
    black \
    isort \
    flake8

# Copy development files
COPY test_api.py .
COPY run-local.py .

# Switch back to appuser
USER appuser

# Development command
CMD ["python", "start.py", "--skip-checks"]
