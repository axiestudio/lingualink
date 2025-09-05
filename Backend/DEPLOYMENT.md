# 🚀 LinguaLink AI Backend - Deployment Guide

## 📋 **Pre-Deployment Checklist**

### ✅ **Production Ready Features:**
- [x] **FastAPI Backend** with async support
- [x] **NLLB-200 Model** integration (200+ languages)
- [x] **Docker Support** with multi-stage builds
- [x] **Security Middleware** (rate limiting, input validation, security headers)
- [x] **Health Checks** (liveness, readiness, detailed health)
- [x] **Performance Monitoring** with metrics endpoints
- [x] **Caching System** with LRU eviction
- [x] **Error Handling** with proper HTTP status codes
- [x] **Logging** with structured production logging
- [x] **CORS Configuration** for frontend integration
- [x] **Environment Configuration** for different deployment stages

### ✅ **Docker & CI/CD:**
- [x] **Production Dockerfile** with security best practices
- [x] **GitHub Actions** workflow for automated builds
- [x] **Docker Compose** for local development and production
- [x] **Security Scanning** with Trivy
- [x] **Multi-stage Builds** for optimized images
- [x] **Health Checks** in Docker containers

## 🐳 **Docker Deployment**

### **Local Testing:**
```bash
# Build and test locally
cd backend
docker build -t lingualink-backend .
docker run -p 8000:8000 lingualink-backend

# Test with Docker Compose
docker-compose up -d
```

### **Production Deployment:**
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Or use the built image from DockerHub
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL="your_neon_db_url" \
  -e ALLOWED_ORIGINS='["https://lingualink.tech"]' \
  your-dockerhub-username/lingualink-ai-backend:latest
```

## 🔧 **Environment Variables**

### **Required for Production:**
```env
# Database
DATABASE_URL=postgresql://neondb_owner:...@ep-orange-sound-ageb2e0i-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# CORS
ALLOWED_ORIGINS=["https://lingualink.tech", "https://www.lingualink.tech"]

# Performance
DEVICE=auto
BATCH_SIZE=2
CACHE_MAX_SIZE=2000

# Security
ENABLE_RATE_LIMITING=true
RATE_LIMIT_PER_MINUTE=60
```

### **Optional:**
```env
# SSL (if using HTTPS)
SSL_KEYFILE=/path/to/private.key
SSL_CERTFILE=/path/to/certificate.crt

# API Authentication
ENABLE_API_KEY_AUTH=true
ALLOWED_API_KEYS=["your-api-key-1", "your-api-key-2"]

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

## 🌐 **Digital Ocean Deployment**

### **Recommended Droplet Specs:**
- **CPU Optimized**: 4 vCPUs, 8GB RAM ($48/month)
- **GPU Enabled**: For maximum performance ($100+/month)
- **Storage**: 50GB+ SSD

### **Deployment Steps:**
1. **Create Droplet** with Docker pre-installed
2. **Clone Repository** and checkout `localllm` branch
3. **Set Environment Variables** in production
4. **Deploy with Docker Compose**
5. **Configure Load Balancer** and SSL
6. **Set up Monitoring** and alerts

## 📊 **Monitoring & Health Checks**

### **Health Endpoints:**
- `GET /health` - Detailed health status
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/live` - Kubernetes liveness probe
- `GET /api/metrics` - Performance metrics

### **Expected Response Times:**
- **Model Loading**: 30-60 seconds (first time)
- **Translation**: 0.5-2 seconds per request
- **Health Check**: <100ms

### **Resource Usage:**
- **Memory**: 4-6GB RAM
- **CPU**: 2-4 cores recommended
- **Storage**: 5GB+ for models
- **Network**: Minimal bandwidth

## 🔒 **Security Considerations**

### **Implemented Security:**
- Rate limiting (60 requests/minute default)
- Input validation and sanitization
- Security headers (XSS, CSRF protection)
- Content-Type validation
- Request size limits
- Non-root Docker user

### **Additional Recommendations:**
- Use HTTPS in production
- Set up firewall rules
- Regular security updates
- Monitor for suspicious activity
- Use secrets management for sensitive data

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **Model Loading Fails:**
```bash
# Check disk space
df -h

# Check memory
free -h

# Check logs
docker logs lingualink-backend
```

#### **High Memory Usage:**
```env
# Enable low memory mode
LOW_MEMORY_MODE=true
BATCH_SIZE=1
MODEL_NAME=facebook/nllb-200-distilled-600M
```

#### **Slow Performance:**
```env
# Enable optimizations
TORCH_COMPILE=true
DEVICE=cuda  # If GPU available
BATCH_SIZE=4  # If memory allows
```

## 📈 **Scaling Considerations**

### **Horizontal Scaling:**
- Multiple backend instances behind load balancer
- Shared Redis cache for distributed caching
- Database connection pooling

### **Vertical Scaling:**
- GPU-enabled instances for better performance
- More RAM for larger models
- SSD storage for faster model loading

## 🎯 **Performance Benchmarks**

### **Expected Performance (Production):**
- **Throughput**: 30-60 requests/minute per instance
- **Latency**: 0.5-2 seconds per translation
- **Accuracy**: 95-99% translation confidence
- **Uptime**: 99.9% availability target

---

**🎉 Your LinguaLink AI Backend is production-ready!**
