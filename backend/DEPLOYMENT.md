# LinguaLink Backend Deployment Guide

## 🚀 Render Deployment

### Prerequisites
- GitHub repository with the backend code
- Render account (free tier available)

### Environment Variables Required
```
NODE_ENV=production
PORT=10000
CLIENT_URL=https://your-frontend-domain.vercel.app
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_email
EMAIL_FROM_NAME=Your App Name
OPENAI_API_KEY=your_openai_api_key
FEATHERLESS_API_KEY=your_featherless_api_key
```

### Deployment Steps
1. Push code to GitHub repository
2. Connect GitHub repo to Render
3. Set environment variables in Render dashboard
4. Deploy and get the production URL
5. Update frontend to use the Render URL

### Features Supported
✅ Socket.io real-time messaging
✅ PostgreSQL database connections
✅ File uploads and image handling
✅ JWT authentication
✅ Translation services
✅ Email notifications
