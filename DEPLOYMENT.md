# 🚀 LinguaLink Fullstack Deployment Guide

## 🎯 Overview
LinguaLink is now configured as a **single fullstack container** that includes both the Next.js frontend and FastAPI backend for simplified deployment.

## 🐳 Docker Hub Integration
- **Repository**: `axiestudio/lingualink`
- **Latest Tag**: `axiestudio/lingualink:latest`
- **Auto-built**: Every push to `main` branch

## 🏗️ Fullstack Architecture

```
┌─────────────────────────────────────┐
│         Docker Container            │
│  ┌─────────────┐ ┌─────────────────┐│
│  │   Next.js   │ │    FastAPI      ││
│  │  Frontend   │ │    Backend      ││
│  │   :3000     │ │     :8000       ││
│  └─────────────┘ └─────────────────┘│
└─────────────────────────────────────┘
           │              │
           ▼              ▼
    ┌─────────────┐ ┌─────────────┐
    │   Redis     │ │ PostgreSQL  │
    │   Cache     │ │  Database   │
    │   :6379     │ │   (Neon)    │
    └─────────────┘ └─────────────┘
```

## 🚀 Quick Deployment

### Option 1: Docker Run (Simple)
```bash
docker run -d \
  --name lingualink \
  -p 80:3000 \
  -p 8000:8000 \
  -e DATABASE_URL="your_database_url" \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_key" \
  -e CLERK_SECRET_KEY="your_clerk_secret" \
  -e NEXT_PUBLIC_APP_URL="https://yourdomain.com" \
  -e FEATHERLESS_API_KEY="your_featherless_key" \
  axiestudio/lingualink:latest
```

### Option 2: Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/axiestudio/lingualink.git
cd lingualink

# Create environment file
cp .env.example .env
# Edit .env with your actual values

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 🌐 Access Points
- **Frontend**: `http://your-server:80`
- **Backend API**: `http://your-server:8000`
- **Health Check**: `http://your-server:80/api/health`

## 🔐 Required Environment Variables
```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
CLERK_WEBHOOK_SECRET=whsec_...
FEATHERLESS_API_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:your-email@domain.com
```

## 🔄 Automatic Updates
Every push to `main` branch:
1. ✅ Builds fullstack Docker image
2. ✅ Pushes to `axiestudio/lingualink:latest`
3. ✅ Ready for deployment

## 📊 Monitoring
### Health Checks
- **Frontend**: `GET /api/health`
- **Backend**: `GET /health`

### Logs
```bash
docker logs lingualink-fullstack -f
```

## 🎯 Production Checklist
- [ ] Environment variables configured
- [ ] Database accessible
- [ ] SSL/TLS certificate
- [ ] Domain DNS configured
- [ ] Firewall rules set
- [ ] Backup strategy
- [ ] Monitoring setup

**Your LinguaLink fullstack application is ready! 🚀**
