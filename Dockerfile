# 🚀 LinguaLink AI - FULLSTACK Docker Image
# Complete Next.js Frontend + FastAPI Backend + NLLB-200 AI Translation
# Single container deployment with embedded AI capabilities

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

# Copy backend requirements for model downloading
COPY Backend/requirements.txt Backend/
COPY Backend/app/core/config.py Backend/app/core/
COPY Backend/app/core/__init__.py Backend/app/core/
COPY Backend/app/__init__.py Backend/app/

# Install Python dependencies
RUN pip install --no-cache-dir -r Backend/requirements.txt

# Copy model download script
COPY Backend/scripts/download_models.py Backend/scripts/

# Download models (this layer will be cached)
ENV MODEL_CACHE_DIR=/app/models
ENV MODEL_NAME=facebook/nllb-200-distilled-600M
RUN python Backend/scripts/download_models.py

# ============================================================================
# Stage 2: Frontend Build (Node.js build stage)
# ============================================================================
FROM node:20-alpine as frontend-builder

# Declare build arguments for environment variables
ARG DATABASE_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG CLERK_WEBHOOK_SECRET
ARG CLERK_JWT_ISSUER_DOMAIN
ARG FEATHERLESS_API_KEY
ARG OPENAI_API_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG VAPID_PRIVATE_KEY
ARG VAPID_SUBJECT

# Set environment variables from build args
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV CLERK_WEBHOOK_SECRET=$CLERK_WEBHOOK_SECRET
ENV CLERK_JWT_ISSUER_DOMAIN=$CLERK_JWT_ISSUER_DOMAIN
ENV FEATHERLESS_API_KEY=$FEATHERLESS_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
ENV VAPID_SUBJECT=$VAPID_SUBJECT
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Set working directory
WORKDIR /app/frontend

# Copy frontend package files
COPY lingualink/package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy frontend source code
COPY lingualink/ ./

# Build the Next.js application
RUN npm run build

# ============================================================================
# Stage 3: Production Runtime (Fullstack)
# ============================================================================
FROM python:3.10-slim as production

# Declare build arguments for runtime environment variables
ARG DATABASE_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG CLERK_WEBHOOK_SECRET
ARG CLERK_JWT_ISSUER_DOMAIN
ARG FEATHERLESS_API_KEY
ARG OPENAI_API_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG VAPID_PRIVATE_KEY
ARG VAPID_SUBJECT

# Set environment variables from build args for runtime
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV CLERK_WEBHOOK_SECRET=$CLERK_WEBHOOK_SECRET
ENV CLERK_JWT_ISSUER_DOMAIN=$CLERK_JWT_ISSUER_DOMAIN
ENV FEATHERLESS_API_KEY=$FEATHERLESS_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
ENV VAPID_SUBJECT=$VAPID_SUBJECT
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Essential system packages
    curl \
    nginx \
    supervisor \
    # Node.js for frontend runtime
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy Python requirements and install dependencies
COPY Backend/requirements.txt Backend/
RUN pip install --no-cache-dir -r Backend/requirements.txt

# Copy models from model-downloader stage
COPY --from=model-downloader /app/models ./models

# Copy backend application code
COPY Backend/ ./Backend/

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/next.config.ts ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Copy remaining frontend files needed for runtime
COPY lingualink/server.js ./frontend/
COPY lingualink/src ./frontend/src

# Copy nginx configuration
COPY nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default && \
    rm -f /etc/nginx/sites-enabled/default

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🚀 Starting LinguaLink AI Fullstack Application..."\n\
mkdir -p /var/log\n\
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf' > /app/start.sh

# Make startup script executable
RUN chmod +x /app/start.sh

# Create necessary directories and set permissions
RUN mkdir -p logs /var/log/nginx && \
    chown -R appuser:appuser /app && \
    chown -R appuser:appuser /var/log

# Expose port 80 (nginx reverse proxy)
EXPOSE 80

# Health check for the complete stack
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost/health && curl -f http://localhost/ || exit 1

# Switch to non-root user for application processes
USER appuser

# Start the fullstack application
CMD ["/app/start.sh"]

# ============================================================================
# Stage 4: Development (Optional, for local development)
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

# Install frontend development dependencies
RUN cd /app/frontend && npm install --include=dev

# Copy development files
COPY backend/test_api.py backend/
COPY backend/run-local.py backend/

# Switch back to appuser
USER appuser

# Development command (with hot reload)
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
