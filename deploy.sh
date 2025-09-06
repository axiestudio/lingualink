#!/bin/bash

# LinguaLink Production Deployment Script
# AS A SENIOR DEVELOPER - Automated deployment to Digital Ocean

set -e

echo "🚀 LinguaLink Production Deployment Script"
echo "==========================================="

# Configuration
REPO_URL="https://github.com/axiestudio/lingualink.git"
DEPLOY_DIR="/opt/lingualink"
BACKUP_DIR="/opt/lingualink-backups"
ENV_FILE="/opt/lingualink/.env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create directories
log_info "Creating deployment directories..."
sudo mkdir -p $DEPLOY_DIR
sudo mkdir -p $BACKUP_DIR
sudo chown $USER:$USER $DEPLOY_DIR
sudo chown $USER:$USER $BACKUP_DIR

# Backup existing deployment
if [ -d "$DEPLOY_DIR/.git" ]; then
    log_info "Creating backup of existing deployment..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    cp -r $DEPLOY_DIR $BACKUP_DIR/$BACKUP_NAME
    log_info "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# Clone or update repository
if [ -d "$DEPLOY_DIR/.git" ]; then
    log_info "Updating existing repository..."
    cd $DEPLOY_DIR
    git fetch origin
    git reset --hard origin/main
else
    log_info "Cloning repository..."
    git clone $REPO_URL $DEPLOY_DIR
    cd $DEPLOY_DIR
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    log_warn "Environment file not found: $ENV_FILE"
    log_info "Creating template environment file..."
    
    cat > $ENV_FILE << 'EOF'
# LinguaLink Production Environment Variables
# AS A SENIOR DEVELOPER - Configure these values for production

# GitHub Repository (for Docker images)
GITHUB_REPOSITORY=axiestudio/lingualink

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Application URLs
NEXT_PUBLIC_APP_URL=https://lingualink.tech

# Local Backend
LOCAL_BACKEND_API_KEY=your_secure_api_key

# External APIs (Fallback)
FEATHERLESS_API_KEY=your_featherless_key
OPENAI_API_KEY=your_openai_key

# Push Notifications
VAPID_PRIVATE_KEY=your_vapid_private_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_SUBJECT=mailto:your-email@domain.com

# Stripe (if using payments)
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Security
JWT_SECRET=your_jwt_secret_key
EOF

    log_warn "Please edit $ENV_FILE with your production values before continuing."
    log_info "Run: nano $ENV_FILE"
    exit 1
fi

# Load environment variables
log_info "Loading environment variables..."
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Pull latest Docker images
log_info "Pulling latest Docker images..."
docker pull ghcr.io/axiestudio/lingualink-frontend:latest
docker pull ghcr.io/axiestudio/lingualink-backend:latest

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Start new containers
log_info "Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 30

# Check service health
log_info "Checking service health..."
if curl -f http://localhost:3000/api/health/system > /dev/null 2>&1; then
    log_info "✅ Frontend is healthy"
else
    log_error "❌ Frontend health check failed"
fi

if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    log_info "✅ Backend is healthy"
else
    log_error "❌ Backend health check failed"
fi

# Clean up old Docker images
log_info "Cleaning up old Docker images..."
docker image prune -f

# Show running containers
log_info "Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

log_info "🎉 Deployment completed successfully!"
log_info "Frontend: http://localhost:3000"
log_info "Backend: http://localhost:8000"
log_info "Logs: docker-compose -f $DEPLOY_DIR/docker-compose.prod.yml logs -f"

echo "==========================================="
echo "🚀 LinguaLink is now running in production!"
