# 🌐 Lingua Link

**Enterprise-Grade Real-Time Translation Messaging Platform**

A sophisticated messaging application that breaks down language barriers through intelligent real-time translation, built with modern web technologies and enterprise-level security.

![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🚀 **Key Features**

### 💬 **Real-Time Messaging**
- **WebSocket-based** instant message delivery
- **Facebook Messenger-style** UI/UX design
- **Optimistic updates** for seamless user experience
- **Auto-scroll** to latest messages with smooth animations

### 🌍 **Intelligent Translation**
- **Automatic language detection** and translation
- **Smart translation logic** - only translates when users have different language preferences
- **Dual message display** - original and translated text
- **Multi-language support** with 50+ languages
- **Group chat translation** to English as common language

### 🔒 **Enterprise Security**
- **Rate limiting** on all API endpoints
- **Input sanitization** and XSS protection
- **SQL injection prevention**
- **Security audit logging** with detailed tracking
- **Authentication middleware** on all protected routes
- **CSRF protection** and secure headers

### ⚡ **Performance & Scalability**
- **Next.js 15** with Turbopack for lightning-fast builds
- **PostgreSQL** with optimized queries and indexing
- **Real-time triggers** for instant data synchronization
- **Efficient caching** strategies
- **Progressive Web App** capabilities

## 🏗️ **Technical Architecture**

### **Frontend Stack**
```typescript
- Next.js 15 (App Router)
- TypeScript 5.0
- Tailwind CSS 3.4
- Framer Motion (animations)
- Lucide React (icons)
- React Hooks (state management)
```

### **Backend Stack**
```typescript
- Next.js API Routes
- PostgreSQL 16
- Clerk Authentication
- WebSocket connections
- Server-Sent Events (SSE)
```

### **Security Layer**
```typescript
- Rate limiting (Redis-like in-memory)
- Input validation & sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens
- Security audit logging
```

## 📁 **Project Structure**

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── messages/          # Message CRUD operations
│   │   ├── realtime/          # WebSocket connections
│   │   ├── translate/         # Translation service
│   │   ├── security/          # Security audit endpoints
│   │   └── user/              # User management
│   ├── dashboard/             # Main messaging interface
│   └── layout.tsx             # Root layout with providers
├── hooks/
│   ├── useDatabase.ts         # Database operations hook
│   ├── useRealtime.ts         # Real-time messaging hook
│   └── usePushNotifications.ts # PWA notifications
├── lib/
│   ├── security-audit.ts      # Security logging system
│   ├── rate-limiter.ts        # Rate limiting implementation
│   ├── translation.ts         # Translation service
│   └── realtime-broadcaster.ts # WebSocket management
└── middleware.ts              # Authentication middleware
```

## 🛠️ **Quick Start**

### **Prerequisites**
- Node.js 18+
- PostgreSQL 16+
- Clerk account (for authentication)

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/axiestudio/lingualink.git
cd lingualink
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
```

4. **Configure environment variables**
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

# Database
POSTGRES_URL=postgresql://username:password@localhost:5432/lingualink

# Optional: External Translation API
TRANSLATION_API_KEY=your_translation_api_key
```

5. **Initialize database**
```bash
npm run dev
# Visit http://localhost:3000/api/init-db to set up tables
```

6. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 **API Documentation**

### **Authentication**
All protected routes require Clerk authentication headers.

### **Core Endpoints**

#### **Messages API**
```typescript
POST /api/messages
{
  "roomId": "room_user1_user2",
  "message": "Hello world",
  "receiverId": "user_123"
}
```

#### **Real-time Connection**
```typescript
GET /api/realtime
// Server-Sent Events stream for real-time updates
```

#### **Translation API**
```typescript
POST /api/translate
{
  "text": "Hello",
  "targetLanguage": "es"
}
```

#### **User Search**
```typescript
GET /api/users/search?q=username
```

### **Security Features**

#### **Rate Limiting**
- **Messages**: 60 requests/minute per user
- **Translation**: 30 requests/minute per user
- **Search**: 20 requests/minute per user
- **Authentication**: 10 requests/minute per IP

#### **Audit Logging**
All security events are logged with:
- User ID and IP address
- Timestamp and action type
- Request details and user agent
- Severity level (LOW, MEDIUM, HIGH, CRITICAL)

## 🗄️ **Database Schema**

### **Core Tables**

```sql
-- Users table (synced with Clerk)
CREATE TABLE users (
  clerk_id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  language_preference VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms for conversations
CREATE TABLE rooms (
  id VARCHAR(255) PRIMARY KEY,
  created_by VARCHAR(255) REFERENCES users(clerk_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages with translation support
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(255) NOT NULL,
  sender_clerk_id VARCHAR(255) REFERENCES users(clerk_id),
  message TEXT NOT NULL,
  translated_message TEXT,
  target_language VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Real-time triggers for instant updates
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('new_message', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🚀 **Deployment**

### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Environment Variables for Production**
```env
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
POSTGRES_URL=postgresql://...

# Optional
TRANSLATION_API_KEY=...
REDIS_URL=redis://...
```

## 🧪 **Testing**

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📊 **Performance Metrics**

- **First Contentful Paint**: < 1.2s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.8s
- **Cumulative Layout Shift**: < 0.1
- **Message Delivery**: < 100ms average latency

## 🔍 **Key Technical Decisions**

### **Why Next.js 15?**
- **App Router** for better performance and developer experience
- **Turbopack** for 10x faster builds
- **Server Components** for optimal loading
- **Built-in API routes** for full-stack development

### **Why PostgreSQL?**
- **ACID compliance** for data integrity
- **Real-time triggers** for instant notifications
- **JSON support** for flexible message metadata
- **Excellent performance** with proper indexing

### **Why Clerk?**
- **Enterprise-grade** authentication
- **Social login** support out of the box
- **User management** dashboard
- **Secure by default** with best practices

### **Translation Strategy**
- **Client-side detection** for instant feedback
- **Server-side processing** for accuracy
- **Caching** to reduce API calls
- **Fallback mechanisms** for reliability

## 🤝 **Contributing**

### **Development Workflow**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### **Code Standards**
- **TypeScript** for type safety
- **ESLint + Prettier** for code formatting
- **Conventional Commits** for clear history
- **Jest** for unit testing
- **Playwright** for E2E testing

### **Security Guidelines**
- Always validate user input
- Use parameterized queries
- Implement rate limiting
- Log security events
- Follow OWASP guidelines

## 📚 **Documentation**

- [Multi-Language Strategy](./docs/MULTI_LANGUAGE_STRATEGY.md)
- [Security Implementation](./docs/SECURITY.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🐛 **Known Issues**

- [ ] Translation API rate limits in free tier
- [ ] WebSocket reconnection on network changes
- [ ] Large file upload support (planned)

## 🗺️ **Roadmap**

- [ ] **File Attachments** - Images, documents, media
- [ ] **Voice Messages** - Audio recording and playback
- [ ] **Video Calls** - WebRTC integration
- [ ] **Message Reactions** - Emoji reactions
- [ ] **Message Threading** - Reply to specific messages
- [ ] **Dark Mode** - Theme switching
- [ ] **Mobile App** - React Native version

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Clerk** for authentication infrastructure
- **Vercel** for hosting and deployment
- **PostgreSQL** team for the amazing database
- **Next.js** team for the incredible framework
- **Tailwind CSS** for the utility-first CSS framework

---

**Built with ❤️ by the Axie Studio Team**

For questions or support, please open an issue or contact us at [support@axiestudio.com](mailto:support@axiestudio.com)
