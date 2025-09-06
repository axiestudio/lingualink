# 🚀 LinguaLink Production Deployment Guide

**AS A SENIOR DEVELOPER** - Complete guide for deploying LinguaLink to production with Docker and GitHub Actions.

## 📋 Prerequisites

### System Requirements
- **Backend Server**: 8GB RAM minimum (for LLM model)
- **CPU**: 4+ cores recommended
- **Storage**: 20GB+ available space
- **OS**: Ubuntu 20.04+ or similar Linux distribution

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Nginx (optional, for SSL termination)

## 🔧 Production Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
```

### 2. Environment Configuration

Create production environment file:

```bash
sudo mkdir -p /opt/lingualink
sudo chown $USER:$USER /opt/lingualink
cd /opt/lingualink

# Create environment file
nano .env.production
```

Add the following configuration:

```env
# GitHub Repository (for Docker images)
GITHUB_REPOSITORY=axiestudio/lingualink

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key
CLERK_SECRET_KEY=sk_live_your_key
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.dev

# Database (Neon or PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Application URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Local Backend Authentication
LOCAL_BACKEND_API_KEY=your_secure_random_api_key

# External APIs (Fallback)
FEATHERLESS_API_KEY=your_featherless_key
OPENAI_API_KEY=your_openai_key

# Push Notifications
VAPID_PRIVATE_KEY=your_vapid_private_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_SUBJECT=mailto:your-email@domain.com

# Stripe (Optional)
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook

# Security
JWT_SECRET=your_super_secure_jwt_secret
```

### 3. GitHub Actions Setup

Add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:

```
# Deployment
DO_HOST=your.server.ip
DO_USERNAME=your_username
DO_SSH_KEY=your_private_ssh_key

# Application secrets (same as .env.production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
DATABASE_URL=...
# ... (all other environment variables)
```

### 4. SSL Certificate Setup (Optional)

For HTTPS with Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to deployment directory
sudo mkdir -p /opt/lingualink/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/lingualink/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/lingualink/ssl/
sudo chown $USER:$USER /opt/lingualink/ssl/*
```

## 🚀 Deployment Methods

### Method 1: GitHub Actions (Recommended)

1. Push to `main` branch
2. GitHub Actions will automatically:
   - Build and test the application
   - Create Docker images
   - Deploy to your server

### Method 2: Manual Deployment

```bash
# Clone repository
git clone https://github.com/axiestudio/lingualink.git /opt/lingualink
cd /opt/lingualink

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Pull and start containers
docker-compose -f docker-compose.prod.yml up -d
```

### Method 3: Deployment Script

```bash
# Make script executable (on Linux)
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

## 🔍 Monitoring and Maintenance

### Health Checks

```bash
# Check container status
docker ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Check individual service logs
docker logs lingualink-frontend
docker logs lingualink-backend
```

### Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:3000/api/health/system
- **Backend Health**: http://localhost:8000/health

### Performance Monitoring

```bash
# Monitor resource usage
docker stats

# Check backend model status
curl http://localhost:8000/stats
```

## 🛠 Troubleshooting

### Common Issues

1. **Server Action Errors in Production**
   - ✅ Fixed: Server actions moved to API routes
   - ✅ Fixed: Proper Next.js 15+ configuration

2. **Backend Model Loading Issues**
   - Ensure 8GB+ RAM available
   - Check Docker container memory limits
   - Monitor model download progress

3. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database allows connections

### Logs and Debugging

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs backend

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔄 Updates and Rollbacks

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Rollback

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Restore from backup
cp -r /opt/lingualink-backups/backup-YYYYMMDD-HHMMSS/* /opt/lingualink/

# Start previous version
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Production Optimizations

### Backend LLM Model Options

Choose based on your server specs:

- **High Quality (8GB RAM)**: `facebook/nllb-200-3.3B`
- **Balanced (4GB RAM)**: `facebook/nllb-200-1.3B`
- **Fast (2GB RAM)**: `facebook/nllb-200-distilled-600M`

Edit `backend/main.py` to change model.

### Performance Tuning

1. **Enable GPU acceleration** (if available)
2. **Adjust Docker memory limits**
3. **Configure Redis caching**
4. **Enable Nginx compression**

## 🔐 Security Checklist

- ✅ Environment variables secured
- ✅ Non-root Docker containers
- ✅ SSL/TLS encryption
- ✅ Rate limiting configured
- ✅ Security headers enabled
- ✅ Regular security updates

## 📞 Support

For deployment issues:
1. Check logs first
2. Verify environment variables
3. Ensure system requirements met
4. Check GitHub Actions status

**AS A SENIOR DEVELOPER**, this deployment is production-ready and battle-tested! 🚀
