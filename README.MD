<h1 align="center">🌍 Lingua Link - Real-time Translation Messaging App 🌍</h1>

![Demo App](/frontend/public/screenshot-for-readme.png)

**Lingua Link** is a revolutionary messaging platform that breaks down language barriers with real-time translation capabilities, allowing users to communicate seamlessly across different languages.

## ✨ Key Features:

- 🌐 **Real-time Translation** - Instant message translation between languages
- 🔐 Custom JWT Authentication (no 3rd-party auth)
- ⚡ Real-time Messaging via Socket.io
- 🟢 Online/Offline Presence Indicators
- 🔔 Notification & Typing Sounds (with toggle)
- 📨 Welcome Emails on Signup (Resend)
- 🗂️ Image Uploads (Neon Database Binary Storage)
- 🧰 REST API with Node.js & Express
- 🧱 PostgreSQL for Data Persistence (Neon)
- 🚦 Custom Security & Rate-Limiting (Built from Ground Up)
- 🎨 Beautiful UI with React, Tailwind CSS & DaisyUI
- 🧠 Zustand for State Management
- 🧑‍💻 Git & GitHub Workflow (branches, PRs, merges)
- 🚀 Easy Deployment (free-tier friendly with Sevalla)

---

## 🧪 .env Setup

### Backend (`/backend`)

```bash
PORT=3000
DATABASE_URL=your_neon_postgresql_uri_here

NODE_ENV=development

JWT_SECRET=your_jwt_secret

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_email_from_address
EMAIL_FROM_NAME=your_email_from_name

CLIENT_URL=http://localhost:5173

# Image uploads handled by Neon database (binary storage)
# Security built from ground up - no third-party dependencies
```

---

## 🔧 Run the Backend

```bash
cd backend
npm install
npm run dev
```

## 💻 Run the Frontend

```bash
cd frontend
npm install
npm run dev
```
