# 🚀 LinguaLink AI - Fullstack Deployment Guide

## 🎯 **Single Container Fullstack Solution**

This deployment provides a **complete LinguaLink AI platform** in a single Docker container:
- **🌐 Next.js Frontend** (React 19, PWA, Real-time messaging)
- **🤖 FastAPI Backend** (NLLB-200 AI, 200+ languages)
- **🔄 Nginx Reverse Proxy** (Load balancing, SSL termination)
- **📊 Embedded AI Translation** (No external API dependencies)

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Container                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Nginx     │  │  Next.js    │  │     FastAPI         │ │
│  │ Port 80     │  │ Port 3000   │  │   Port 8000         │ │
│  │ (Proxy)     │  │ (Frontend)  │  │   (Backend+AI)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **🌐 URL Routing:**
- **Frontend:** `http://localhost/` → Next.js (port 3000)
- **Backend API:** `http://localhost/api/` → FastAPI (port 8000)
- **Health Check:** `http://localhost/health` → Backend health
- **API Docs:** `http://localhost/docs` → FastAPI documentation

## 🚀 **Quick Deployment**

### **Option 1: Docker Compose (Recommended)**
```bash
# Clone repository
git clone https://github.com/axiestudio/lingualink.git
cd lingualink

# Deploy fullstack
docker-compose -f docker-compose.fullstack.yml up -d

# Check status
docker-compose -f docker-compose.fullstack.yml ps
```

### **Option 2: Docker Run**
```bash
# Pull and run the fullstack image
docker run -d \
  --name lingualink-fullstack \
  -p 80:80 \
  -e DATABASE_URL="your_database_url" \
  axiestudio/lingualink-ai-fullstack:latest

# Check logs
docker logs lingualink-fullstack
```

### **Option 3: GitHub Actions Build**
```bash
# Push to backend branch triggers automatic build
git push origin backend

# Image will be available at:
# axiestudio/lingualink-ai-fullstack:backend
```

## 🔧 **Environment Configuration**

### **Required Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/lingualink

# Backend Configuration
MODEL_NAME=facebook/nllb-200-distilled-600M
DEVICE=auto
ENABLE_CACHING=true
RATE_LIMIT_PER_MINUTE=60

# Frontend Configuration
NEXT_PUBLIC_BACKEND_TRANSLATION_URL=http://localhost:8000
ENABLE_LOCAL_BACKEND=true
```

### **Optional Environment Variables:**
```env
# Performance Tuning
BATCH_SIZE=2
CACHE_MAX_SIZE=2000
TORCH_COMPILE=true
LOW_MEMORY_MODE=false

# Security
ENABLE_RATE_LIMITING=true
ENABLE_API_KEY_AUTH=false

# SSL (if using HTTPS)
SSL_KEYFILE=/path/to/private.key
SSL_CERTFILE=/path/to/certificate.crt
```

## 📊 **Resource Requirements**

### **Minimum Requirements:**
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 10GB
- **Network:** 1Mbps

### **Recommended (Production):**
- **CPU:** 4 cores
- **RAM:** 8GB
- **Storage:** 20GB SSD
- **Network:** 10Mbps

### **Optimal (High Performance):**
- **CPU:** 8 cores + GPU
- **RAM:** 16GB
- **Storage:** 50GB NVMe SSD
- **Network:** 100Mbps

## 🌐 **Digital Ocean Deployment**

### **1. Create Droplet**
```bash
# Create CPU-optimized droplet
doctl compute droplet create lingualink-ai \
  --image docker-20-04 \
  --size c-4 \
  --region nyc1 \
  --ssh-keys your-ssh-key-id
```

### **2. Deploy Application**
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Deploy fullstack container
docker run -d \
  --name lingualink-fullstack \
  --restart unless-stopped \
  -p 80:80 \
  -e DATABASE_URL="$DATABASE_URL" \
  axiestudio/lingualink-ai-fullstack:latest
```

### **3. Configure Domain & SSL**
```bash
# Install Certbot for SSL
apt update && apt install certbot

# Get SSL certificate
certbot certonly --standalone -d yourdomain.com

# Update container with SSL
docker run -d \
  --name lingualink-fullstack-ssl \
  --restart unless-stopped \
  -p 80:80 -p 443:443 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -e SSL_CERTFILE=/etc/letsencrypt/live/yourdomain.com/fullchain.pem \
  -e SSL_KEYFILE=/etc/letsencrypt/live/yourdomain.com/privkey.pem \
  axiestudio/lingualink-ai-fullstack:latest
```

## 🔍 **Health Monitoring**

### **Health Check Endpoints:**
```bash
# Overall health (frontend + backend)
curl http://localhost/health

# Frontend health
curl http://localhost/

# Backend health
curl http://localhost/api/health

# API documentation
curl http://localhost/docs
```

### **Container Logs:**
```bash
# View all logs
docker logs lingualink-fullstack

# Follow logs in real-time
docker logs -f lingualink-fullstack

# View specific service logs
docker exec lingualink-fullstack tail -f /var/log/frontend.out.log
docker exec lingualink-fullstack tail -f /var/log/backend.out.log
docker exec lingualink-fullstack tail -f /var/log/nginx.out.log
```

## 🚨 **Troubleshooting**

### **Container Won't Start:**
```bash
# Check container status
docker ps -a

# View startup logs
docker logs lingualink-fullstack

# Check resource usage
docker stats lingualink-fullstack
```

### **Frontend Not Loading:**
```bash
# Check nginx configuration
docker exec lingualink-fullstack nginx -t

# Restart nginx
docker exec lingualink-fullstack supervisorctl restart nginx
```

### **Backend API Errors:**
```bash
# Check backend logs
docker exec lingualink-fullstack tail -f /var/log/backend.err.log

# Test backend directly
curl http://localhost:8000/health

# Restart backend
docker exec lingualink-fullstack supervisorctl restart backend
```

### **AI Translation Issues:**
```bash
# Check model loading
docker exec lingualink-fullstack ls -la /app/models

# Check GPU availability
docker exec lingualink-fullstack python -c "import torch; print(torch.cuda.is_available())"

# Test translation endpoint
curl -X POST http://localhost/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "targetLanguage": "es"}'
```

## 📈 **Performance Optimization**

### **For CPU-Only Systems:**
```env
DEVICE=cpu
BATCH_SIZE=1
LOW_MEMORY_MODE=true
TORCH_COMPILE=false
```

### **For GPU Systems:**
```env
DEVICE=cuda
BATCH_SIZE=4
LOW_MEMORY_MODE=false
TORCH_COMPILE=true
```

### **For High-Traffic Sites:**
```env
CACHE_MAX_SIZE=5000
CACHE_TTL=7200
RATE_LIMIT_PER_MINUTE=120
```

## 🎯 **Production Checklist**

- [ ] **Environment variables** configured
- [ ] **Database** connection tested
- [ ] **SSL certificates** installed
- [ ] **Domain** pointing to server
- [ ] **Firewall** configured (ports 80, 443)
- [ ] **Monitoring** set up
- [ ] **Backups** configured
- [ ] **Resource limits** set
- [ ] **Health checks** passing
- [ ] **Performance** tested

---

**🎉 Your LinguaLink AI Fullstack application is ready for production deployment!**

**🌐 Access your application at: http://your-domain.com**
**🤖 AI Translation API: http://your-domain.com/api/translate**
**📊 Health Status: http://your-domain.com/health**
