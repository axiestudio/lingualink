# LinguaLink Local LLM Backend Dockerfile
# AS A SENIOR DEVELOPER - Production-ready containerized backend

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for ML/AI workloads
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    curl \
    git \
    wget \
    libgomp1 \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV HF_HOME=/app/.cache/huggingface
ENV TRANSFORMERS_CACHE=/app/.cache/transformers
ENV TORCH_HOME=/app/.cache/torch

# Create cache directories
RUN mkdir -p /app/.cache/huggingface /app/.cache/transformers /app/.cache/torch

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app && \
    chmod -R 755 /app
USER app

# Expose port
EXPOSE 8000

# Health check (longer start period for model loading)
HEALTHCHECK --interval=30s --timeout=30s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Pre-download model on build (optional - uncomment for faster startup)
# RUN python -c "from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; AutoTokenizer.from_pretrained('facebook/nllb-200-3.3B'); AutoModelForSeq2SeqLM.from_pretrained('facebook/nllb-200-3.3B')"

# Run the application with uvicorn for production - MULTI-USER OPTIMIZED
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--max-requests", "1000", "--max-requests-jitter", "100"]
